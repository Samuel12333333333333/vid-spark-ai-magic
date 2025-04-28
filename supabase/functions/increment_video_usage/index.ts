
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
    console.log(`Incrementing video usage for user: ${userId}`);
    
    // Check if user has an active subscription
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('plan_name, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
      
    // Set limits based on subscription tier
    let isSubscribed = false;
    let videoLimit = 2; // Free tier default
    
    if (subscriptionData) {
      isSubscribed = true;
      const planName = subscriptionData.plan_name.toLowerCase();
      if (planName === 'pro') {
        videoLimit = 20;
      } else if (planName === 'business') {
        videoLimit = 50;
      }
    }
    
    // Set up query parameters based on subscription status
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    let videoQuery = supabase
      .from('video_projects')
      .select('id')
      .eq('user_id', userId);
      
    // For subscribers, only count videos from this month
    // For free users, count all videos
    if (isSubscribed) {
      videoQuery = videoQuery
        .gte('created_at', firstDayOfMonth.toISOString())
        .lt('created_at', firstDayOfNextMonth.toISOString());
    }
    
    const { data: existingVideos, error: countError } = await videoQuery;
    
    if (countError) {
      console.error("Error checking video count:", countError);
      return new Response(
        JSON.stringify({ error: "Database error", details: countError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Check if user has reached their limit
    if (existingVideos.length >= videoLimit) {
      return new Response(
        JSON.stringify({ 
          error: "Video limit reached", 
          details: "You have reached your video limit for your current plan",
          count: existingVideos.length,
          limit: videoLimit,
          reset_at: isSubscribed ? firstDayOfNextMonth.toISOString() : null
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }
    
    // Return updated usage data - The insertion of the actual video will happen elsewhere
    return new Response(
      JSON.stringify({ 
        count: existingVideos.length + 1, // +1 since we're about to create a new video
        reset_at: isSubscribed ? firstDayOfNextMonth.toISOString() : null,
        limit: videoLimit,
        is_subscribed: isSubscribed
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in increment_video_usage function:", error);
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
