
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

    // Get the user's subscription with Paystack card details
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // If no subscription with card details exists, return empty payment methods
    if (!subscription || !subscription.paystack_card_signature) {
      return new Response(
        JSON.stringify({ paymentMethods: [] }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    // For demonstration purposes, create a payment method object
    // In a production environment, you would fetch this from Paystack API
    const paymentMethods = [{
      id: subscription.paystack_card_signature || "card_1",
      brand: "visa", // Default to visa as Paystack doesn't expose this easily
      last4: "4242", // Default value as Paystack doesn't expose this easily
      expMonth: 12,
      expYear: 2030,
      isDefault: true
    }];

    return new Response(
      JSON.stringify({ paymentMethods }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
