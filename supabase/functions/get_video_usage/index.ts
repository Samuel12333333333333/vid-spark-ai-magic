
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
    // Get Supabase client with service key for admin operations
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
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_name, status, current_period_end, created_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
      
    if (subError) {
      console.log("No active subscription found:", subError.message);
    }
      
    // Calculate video limits based on subscription plan
    let isSubscribed = false;
    let isPro = false;
    let isBusiness = false;
    let videoLimit = 2; // Default for free tier (total videos)
    let resetDate = null;
    let subscriptionStartDate = null;
    
    if (subscriptionData) {
      isSubscribed = true;
      const planName = subscriptionData.plan_name.toLowerCase();
      
      // Apply the exact limits based on the plan
      if (planName === 'pro') {
        isPro = true;
        videoLimit = 20; // 20 videos per month for Pro
      } else if (planName === 'business') {
        isBusiness = true;
        videoLimit = 50; // 50 videos per month for Business
      }
      
      // Use the current_period_end from the subscription as the reset date
      if (subscriptionData.current_period_end) {
        resetDate = new Date(subscriptionData.current_period_end).toISOString();
      }

      // Store subscription start date to filter video counts
      if (subscriptionData.created_at) {
        subscriptionStartDate = new Date(subscriptionData.created_at).toISOString();
      }
    }
    
    // For calculating time periods
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    // Query to count videos created
    // - For subscribed users: count videos from the subscription start date or current billing period
    // - For free users: count ALL videos ever created (lifetime limit)
    let query = supabase
      .from('video_projects')
      .select('id')
      .eq('user_id', userId);
      
    if (isSubscribed && subscriptionStartDate) {
      // For subscribers, only count videos created after subscription start date
      query = query
        .gte('created_at', subscriptionStartDate);
    }
    
    const { data: videoData, error: videoError } = await query;
    
    if (videoError) {
      console.error("Error querying video projects:", videoError);
      return new Response(
        JSON.stringify({ error: "Database error", details: videoError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    console.log(`User has created ${videoData.length} videos out of ${videoLimit} limit`);
    
    // For subscribed users, reset date is next billing cycle date
    // For free users, there's no reset (it's a lifetime limit)
    const effectiveResetDate = resetDate || (isSubscribed ? firstDayOfNextMonth.toISOString() : null);
    
    // Return usage data
    return new Response(
      JSON.stringify({ 
        count: videoData.length,
        limit: videoLimit,
        reset_at: effectiveResetDate,
        subscription_start: subscriptionStartDate,
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
