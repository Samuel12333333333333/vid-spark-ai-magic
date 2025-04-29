
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
    console.log("Get payment history function called");
    
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
      throw new Error("Missing Authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      console.error("Auth error:", error);
      throw new Error("User not authenticated");
    }

    console.log("Getting payment history for user:", user.id);

    // Get the customer ID from the subscriptions table
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    // If no subscription found, check if customer exists in Stripe
    let customerId;
    if (!subscription?.stripe_customer_id) {
      // Try to find customer directly in Stripe
      const { data: customers } = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (!customers || customers.length === 0) {
        // No customer means no payment history
        return new Response(JSON.stringify({ paymentHistory: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      customerId = customers[0].id;
    } else {
      customerId = subscription.stripe_customer_id;
    }

    console.log("Found customer ID:", customerId);
    
    // Get all payment intents for the customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 25,
    });

    // Get all invoice payments for subscription charges
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 25,
      status: 'paid',
    });

    // Format payment intents
    const paymentHistory = [
      ...paymentIntents.data.map(pi => ({
        id: pi.id,
        amount: pi.amount,
        status: pi.status,
        created: pi.created,
        receiptUrl: pi.charges.data[0]?.receipt_url,
      })),
      ...invoices.data.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid,
        status: invoice.status === 'paid' ? 'succeeded' : invoice.status,
        created: invoice.created,
        receiptUrl: invoice.hosted_invoice_url,
      }))
    ].sort((a, b) => b.created - a.created);

    console.log("Retrieved payment history:", paymentHistory.length);
    
    return new Response(JSON.stringify({ paymentHistory }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
