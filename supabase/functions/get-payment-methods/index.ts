
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

    // Get the user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // For Paystack, we don't store payment methods the same way as Stripe
    // We'll check if there's a card signature stored from previous payments
    
    let paymentMethods = [];
    
    if (subscription && subscription.paystack_card_signature) {
      // If we have a card signature, it means there's a saved card
      paymentMethods = [{
        id: subscription.paystack_card_signature,
        brand: "card", // Paystack doesn't provide as detailed info as Stripe without additional API calls
        last4: subscription.paystack_card_signature.substring(subscription.paystack_card_signature.length - 4),
        expMonth: 12, // Placeholder as Paystack doesn't store these details in the same way
        expYear: new Date().getFullYear() + 1, // Placeholder
        isDefault: true
      }];
    }

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
