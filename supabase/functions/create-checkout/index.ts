
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
    // Parse request body
    const { plan } = await req.json();
    
    // Initialize Paystack with the secret key
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY is not set");
      throw new Error("Paystack secret key is not configured");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Get the user from the auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing auth header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const user = userData.user;
    console.log("Creating checkout for user:", user.id);

    // Get the origin for success/cancel URLs
    const origin = req.headers.get("origin") || "http://localhost:5173";

    // Determine amount based on plan
    let amount: number;
    let planName: string;
    
    if (plan === "business") {
      amount = 9900 * 100; // 99.00 USD in kobo (Paystack uses the smallest currency unit)
      planName = "Business";
    } else {
      // Default to Pro plan
      amount = 2900 * 100; // 29.00 USD in kobo
      planName = "Pro";
    }

    // Create Paystack checkout initialization
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amount,
        callback_url: `${origin}/payment-success?plan=${plan}`,
        metadata: {
          userId: user.id,
          plan: plan || "pro",
          planName,
          custom_fields: [
            {
              display_name: "Plan Type",
              variable_name: "plan_type",
              value: planName
            }
          ]
        },
      }),
    });

    const paystackData = await response.json();

    if (!response.ok) {
      console.error("Paystack error:", paystackData);
      throw new Error(paystackData.message || "Failed to create payment link");
    }

    console.log("Checkout session created:", paystackData);

    return new Response(
      JSON.stringify({ url: paystackData.data.authorization_url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
