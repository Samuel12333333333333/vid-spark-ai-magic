
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Check subscription function called");
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("Supabase environment variables are not set");
      throw new Error("Supabase configuration is missing");
    }
    
    // Client for auth (with anon key)
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Admin client for database operations (with service key)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      console.error("Auth error:", error);
      throw new Error("User not authenticated");
    }

    console.log("Checking subscription for user:", user.id);

    // Check if user has a subscription
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();
      
    if (subscription) {
      // Check if the subscription has expired
      const currentPeriodEnd = new Date(subscription.current_period_end);
      const now = new Date();
      
      if (currentPeriodEnd < now) {
        // Subscription has expired, update status to inactive
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "expired" })
          .eq("id", subscription.id);
          
        return new Response(JSON.stringify({ 
          hasActiveSubscription: false,
          subscription: { ...subscription, status: "expired" }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      return new Response(JSON.stringify({ 
        hasActiveSubscription: true,
        subscription: subscription
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    return new Response(JSON.stringify({ 
      hasActiveSubscription: false,
      subscription: null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("General error in check-subscription:", error);
    
    // Return a 200 response with error information rather than a 400
    return new Response(JSON.stringify({ 
      hasActiveSubscription: false,
      subscription: null,
      error: error.message,
      errorType: "function_error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 even on error to prevent cascading failures
    });
  }
});
