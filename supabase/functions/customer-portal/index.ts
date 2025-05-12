
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error(userError?.message || 'Authentication failed');
    }
    
    // Paystack doesn't have a customer portal like Stripe
    // Instead, we redirect to our own upgrade page where users can manage their subscription
    const origin = req.headers.get("origin") || "https://smartvideofy.com";
    
    return new Response(
      JSON.stringify({
        url: `${origin}/dashboard/upgrade`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error accessing customer portal:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
