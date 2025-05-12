
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    // Get the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      throw new Error(userError?.message || 'Authentication failed');
    }
    
    // Get the request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      throw new Error("Invalid request body");
    }
    
    const { plan } = requestBody;
    if (!plan) {
      throw new Error("Plan is required");
    }

    console.log("Plan requested:", plan);

    // Set the plan code based on the requested plan
    let planCode;
    let amount;
    switch (plan.toLowerCase()) {
      case "pro":
        planCode = "PLN_h6tsrxea7rzn5x9";
        amount = 2900;
        break;
      case "business":
        planCode = "PLN_2e5qkue1lz5a48g";
        amount = 9900;
        break;
      default:
        throw new Error(`Invalid plan selected: ${plan}`);
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
    
    const origin = req.headers.get('origin') || 'https://smartvideofy.com';
    const successUrl = `${origin}/payment-success?reference=${reference}&plan=${plan}`;

    // Initialize the transaction with Paystack
    const payload = {
      email: user.email,
      amount: amount * 100, // convert to kobo/cents
      reference: reference,
      callback_url: successUrl,
      metadata: metadata,
    };

    console.log("Initializing Paystack transaction with payload:", JSON.stringify(payload));
    
    // Make request to the Paystack API
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY is missing");
      throw new Error("PAYSTACK_SECRET_KEY is not set");
    }

    try {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      
      // Get response text for logging
      const responseText = await response.text();
      console.log("Paystack API raw response:", responseText);
      
      // Parse the response as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Error parsing response:", e);
        throw new Error("Invalid response from payment provider");
      }

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
    } catch (fetchError) {
      console.error("Error fetching from Paystack:", fetchError);
      throw new Error(`Paystack API error: ${fetchError.message}`);
    }
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
