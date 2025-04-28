
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Get Supabase client with service key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase environment variables are not set");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error", 
          details: "Missing Supabase credentials" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "Missing authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    // Extract and decode JWT to get user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Error getting user from token:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "Invalid token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    const userId = user.id;
    console.log(`Getting video usage for user: ${userId}`);
    
    // Check if user has a subscription
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('plan_name, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
      
    // Calculate video limits based on subscription plan
    let isSubscribed = false;
    let isPro = false;
    let isBusiness = false;
    
    if (subscriptionData) {
      isSubscribed = true;
      isPro = subscriptionData.plan_name.toLowerCase() === 'pro';
      isBusiness = subscriptionData.plan_name.toLowerCase() === 'business';
    }
    
    // Get first day of current month for monthly subscriptions
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    // Query to count videos created this month (for subscribers) or total (for free tier)
    let query = supabase
      .from('video_projects')
      .select('id')
      .eq('user_id', userId);
      
    // For subscribers, only count videos created in the current billing period
    // For free users, count all videos ever created
    if (isSubscribed) {
      query = query
        .gte('created_at', firstDayOfMonth.toISOString())
        .lt('created_at', firstDayOfNextMonth.toISOString());
    }
    
    const { data: videoData, error: videoError } = await query;
    
    if (videoError) {
      console.error("Error querying video projects:", videoError);
      return new Response(
        JSON.stringify({ error: "Database error", details: videoError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // For subscribed users, reset date is next month
    // For free users, there's no reset since it's a total limit
    const resetAt = isSubscribed ? firstDayOfNextMonth.toISOString() : null;
    
    // Return usage data
    return new Response(
      JSON.stringify({ 
        count: videoData.length,
        reset_at: resetAt,
        is_subscribed: isSubscribed,
        is_pro: isPro,
        is_business: isBusiness
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in get_video_usage function:", error);
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
