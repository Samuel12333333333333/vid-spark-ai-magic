
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import Stripe from "https://esm.sh/stripe@12.0.0";

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
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Received checkout request with:", requestBody);
    } catch (error) {
      console.error("Error parsing request body:", error.message);
      throw new Error("Invalid request body");
    }
    
    const { priceId, plan } = requestBody;
    
    if (!priceId) {
      console.error("Missing priceId in request");
      throw new Error("Price ID is required");
    }

    // Initialize Stripe with the secret key
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not set");
      throw new Error("Stripe secret key is not configured");
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Create Supabase client to get user information
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase environment variables are not set");
      throw new Error("Supabase configuration is missing");
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      throw new Error("Missing Authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      console.error("Auth error:", error);
      throw new Error("User not authenticated");
    }

    console.log("Creating checkout for user:", user.id);

    // Check if this user already has a Stripe customer ID
    let customerId;
    try {
      const { data: customers } = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers && customers.length > 0) {
        customerId = customers[0].id;
        console.log("Found existing customer:", customerId);
      } else {
        // Create a new customer if one doesn't exist
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });
        customerId = customer.id;
        console.log("Created new customer:", customerId);
      }
    } catch (stripeError) {
      console.error("Stripe customer error:", stripeError);
      throw new Error(`Stripe customer error: ${stripeError.message}`);
    }

    const origin = req.headers.get("origin") || "https://vid-spark-ai-magic.lovable.app";
    
    // Create checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard/upgrade`,
        metadata: {
          userId: user.id,
          plan: plan,
        },
      });

      console.log("Checkout session created:", session.id);
      
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (checkoutError) {
      console.error("Error creating checkout session:", checkoutError);
      throw new Error(`Stripe checkout error: ${checkoutError.message}`);
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
