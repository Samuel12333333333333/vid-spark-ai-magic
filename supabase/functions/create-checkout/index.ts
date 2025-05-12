
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
    console.log("Create checkout function called");
    
    // Get Paystack API key
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    const paystackPublicKey = Deno.env.get("PAYSTACK_PUBLIC_KEY");

    if (!paystackSecretKey || !paystackPublicKey) {
      console.error("PAYSTACK_SECRET_KEY or PAYSTACK_PUBLIC_KEY is not set");
      throw new Error("Paystack API keys are not configured");
    }
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables are missing");
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the user from the auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      throw new Error("User not authenticated");
    }

    // Parse request body
    const { plan } = await req.json();
    
    if (!plan) {
      throw new Error("Plan is required");
    }

    // Map plan identifiers to Paystack plan codes
    const planCodes = {
      pro: "PLN_383o9f3xpppuldc",    // Pro plan code from your image
      business: "PLN_3itdIrrolmalvwe" // Business plan code from your image
    };
    
    const planCode = planCodes[plan];
    if (!planCode) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    // Configure Paystack checkout
    const amount = plan === 'pro' ? 375228 : 1279575; // Amount in cents (kobo)
    const planName = plan === 'pro' ? 'Pro' : 'Business';
    
    // Generate a unique reference
    const reference = `sv_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    
    // Create payment data
    const paymentData = {
      email: user.email,
      amount, // amount in kobo
      reference,
      callback_url: `${req.headers.get('origin') || 'https://smartvideofy.com'}/payment-success?reference=${reference}&plan=${plan}`,
      metadata: {
        userId: user.id,
        plan,
        custom_fields: [
          {
            display_name: "Plan",
            variable_name: "plan",
            value: planName
          }
        ]
      }
    };
    
    console.log("Initializing Paystack transaction:", paymentData);
    
    // Initialize a transaction with Paystack
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentData)
    });
    
    const paystackResponse = await response.json();
    
    if (!paystackResponse.status) {
      console.error("Paystack error:", paystackResponse);
      throw new Error(paystackResponse.message || "Failed to initialize payment");
    }
    
    const checkoutUrl = paystackResponse.data.authorization_url;
    
    return new Response(
      JSON.stringify({ url: checkoutUrl, reference }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
