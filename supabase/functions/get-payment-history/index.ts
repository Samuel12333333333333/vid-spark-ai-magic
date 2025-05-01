
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
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    
    if (subscriptionError) {
      console.error("Error fetching subscription:", subscriptionError);
      // Continue execution to try finding customer by email
    }

    // If no subscription found, check if customer exists in Stripe
    let customerId;
    if (!subscription?.stripe_customer_id) {
      console.log("No active subscription found, searching for customer by email");
      try {
        // Try to find customer directly in Stripe
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        });

        if (customers && customers.data.length > 0) {
          customerId = customers.data[0].id;
          console.log("Found customer by email:", customerId);
        } else {
          console.log("No customer found for email:", user.email);
          // No customer means no payment history
          return new Response(JSON.stringify({ paymentHistory: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      } catch (stripeError) {
        console.error("Error searching for customer:", stripeError);
        // Return empty payment history rather than error
        return new Response(JSON.stringify({ paymentHistory: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } else {
      customerId = subscription.stripe_customer_id;
    }

    console.log("Found customer ID:", customerId);
    
    try {
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

      // Format payment intents - with safety checks
      const paymentHistory = [
        ...(paymentIntents?.data || []).map(pi => ({
          id: pi.id,
          amount: pi.amount || 0,
          status: pi.status || 'unknown',
          created: pi.created || Date.now()/1000,
          receiptUrl: pi.charges?.data?.[0]?.receipt_url || null,
        })),
        ...(invoices?.data || []).map(invoice => ({
          id: invoice.id,
          amount: invoice.amount_paid || 0,
          status: invoice.status === 'paid' ? 'succeeded' : invoice.status,
          created: invoice.created || Date.now()/1000,
          receiptUrl: invoice.hosted_invoice_url || null,
        }))
      ].sort((a, b) => b.created - a.created);

      console.log("Retrieved payment history:", paymentHistory.length);
      
      return new Response(JSON.stringify({ paymentHistory }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (stripeError) {
      console.error("Error fetching from Stripe:", stripeError);
      // Return empty payment history with a warning message
      return new Response(JSON.stringify({ 
        paymentHistory: [],
        warning: `Could not retrieve payment history: ${stripeError.message}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 instead of error to prevent UI issues
      });
    }
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      paymentHistory: [] // Return empty array to prevent UI issues
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 instead of error to prevent UI issues
    });
  }
});
