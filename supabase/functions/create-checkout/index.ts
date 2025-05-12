
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

    // Get the auth header from the request
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
    
    // Get the request body
    const { plan } = await req.json();
    if (!plan) {
      throw new Error("Plan is required");
    }

    // Set the plan code based on the requested plan
    // Using the correct plan codes provided by the user
    let planCode;
    switch (plan.toLowerCase()) {
      case "pro":
        planCode = "PLN_h6tsrxea7rzn5x9"; // Pro plan
        break;
      case "business":
        planCode = "PLN_2e5qkue1lz5a48g"; // Business plan
        break;
      default:
        throw new Error("Invalid plan selected");
    }
    
    // Generate a unique reference
    const reference = `sv_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    
    // Create metadata with user information
    const metadata = {
      userId: user.id,
      plan: plan,
      custom_fields: [
        {
          display_name: "Plan",
          variable_name: "plan",
          value: plan.charAt(0).toUpperCase() + plan.slice(1),
        }
      ]
    };
    
    const successUrl = `https://smartvideofy.com/payment-success?reference=${reference}&plan=${plan}`;

    // Initialize the transaction with Paystack
    const payload = {
      email: user.email,
      amount: plan.toLowerCase() === "pro" ? 2900 * 100 : 9900 * 100, // convert to kobo/cents
      reference: reference,
      callback_url: successUrl,
      metadata: metadata,
      plan: planCode, // Use the plan code directly
    };

    console.log("Initializing Paystack transaction:", payload);
    
    // Make request to the Paystack API
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not set");
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!result.status) {
      console.error("Paystack error:", result);
      throw new Error(result.message || "Payment initialization failed");
    }

    // Return the authorization URL
    return new Response(
      JSON.stringify({ 
        url: result.data.authorization_url,
        reference: reference 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Something went wrong" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
