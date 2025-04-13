
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
    console.log("Check subscription function called");
    
    // Initialize Stripe with the secret key
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not set");
      throw new Error("Stripe secret key is not configured");
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("Supabase environment variables are not set");
      throw new Error("Supabase configuration is missing");
    }
    
    // Client for auth (with anon key)
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Admin client for database operations (with service key)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

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

    console.log("Checking subscription for user:", user.id);

    // Check if this user has a Stripe customer
    const { data: customers } = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (!customers || customers.length === 0) {
      console.log("No Stripe customer found for user:", user.id);
      
      // No customer means no subscription
      return new Response(JSON.stringify({ 
        hasActiveSubscription: false,
        subscription: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers[0].id;
    console.log("Found Stripe customer:", customerId);

    // Check for active subscriptions
    const { data: subscriptions } = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    let subscriptionData = null;
    
    if (subscriptions && subscriptions.length > 0) {
      const stripeSubscription = subscriptions[0];
      console.log("Found active subscription:", stripeSubscription.id);
      
      // Get the plan details
      const priceId = stripeSubscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const productId = price.product;
      const product = await stripe.products.retrieve(productId as string);
      
      let planName = "pro"; // Default
      
      if (product.name.toLowerCase().includes("business")) {
        planName = "business";
      } else if (product.name.toLowerCase().includes("pro")) {
        planName = "pro";
      }
      
      // Create or update subscription record
      const { data: updatedSubscription, error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscription.id,
          plan_name: planName,
          status: stripeSubscription.status,
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'user_id',
          returning: 'representation'
        });
        
      if (updateError) {
        console.error("Error updating subscription in database:", updateError);
        throw new Error(`Database error: ${updateError.message}`);
      }
      
      subscriptionData = updatedSubscription[0];
      console.log("Updated subscription in database:", subscriptionData);
    } else {
      console.log("No active subscription found for customer:", customerId);
      
      // Clear any existing subscription records
      const { error: deleteError } = await supabaseAdmin
        .from("subscriptions")
        .delete()
        .eq("user_id", user.id);
        
      if (deleteError) {
        console.error("Error removing old subscription records:", deleteError);
      }
    }

    return new Response(JSON.stringify({ 
      hasActiveSubscription: !!subscriptionData,
      subscription: subscriptionData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
