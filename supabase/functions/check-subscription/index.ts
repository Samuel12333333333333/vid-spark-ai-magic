
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

    // Check if user has a subscription record first (before calling Stripe)
    const { data: existingSubscription } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();
      
    if (existingSubscription && existingSubscription.status === "active") {
      // If we already have an active subscription record, return it without calling Stripe
      console.log("Using existing subscription record from database:", existingSubscription);
      return new Response(JSON.stringify({ 
        hasActiveSubscription: true,
        subscription: existingSubscription
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    try {
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
        
        // First check if there's an existing subscription record
        const { data: existingSubscription } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single();
          
        if (existingSubscription) {
          // Update existing record
          const { data: updatedSubscription, error: updateError } = await supabaseAdmin
            .from("subscriptions")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: stripeSubscription.id,
              plan_name: planName,
              status: stripeSubscription.status,
              current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
            .select();
            
          if (updateError) {
            console.error("Error updating subscription in database:", updateError);
            throw new Error(`Database error: ${updateError.message}`);
          }
          
          subscriptionData = updatedSubscription[0];
          console.log("Updated subscription in database:", subscriptionData);
        } else {
          // Insert new record
          const { data: newSubscription, error: insertError } = await supabaseAdmin
            .from("subscriptions")
            .insert({
              user_id: user.id,
              stripe_customer_id: customerId,
              stripe_subscription_id: stripeSubscription.id,
              plan_name: planName,
              status: stripeSubscription.status,
              current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            })
            .select();
            
          if (insertError) {
            console.error("Error inserting subscription in database:", insertError);
            throw new Error(`Database error: ${insertError.message}`);
          }
          
          subscriptionData = newSubscription[0];
        }
      } else {
        console.log("No active subscription found for customer:", customerId);
        
        // If no active subscription, check if there's an existing record to update
        const { data: existingSubscription } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single();
          
        if (existingSubscription) {
          // Update to inactive status
          const { data: updatedSubscription, error: updateError } = await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
            .select();
            
          if (updateError) {
            console.error("Error updating subscription status:", updateError);
            throw new Error(`Database error: ${updateError.message}`);
          }
          
          subscriptionData = updatedSubscription[0];
        }
      }

      return new Response(JSON.stringify({ 
        hasActiveSubscription: subscriptionData?.status === "active",
        subscription: subscriptionData
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (stripeError) {
      // If we get a rate limit error from Stripe, fall back to using the database record
      console.error("Stripe API error:", stripeError);
      
      // Return a fallback response using just the database record
      if (existingSubscription) {
        console.log("Falling back to existing subscription record due to Stripe API error");
        return new Response(JSON.stringify({ 
          hasActiveSubscription: existingSubscription.status === "active",
          subscription: existingSubscription
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      // If no subscription record exists, return empty result
      return new Response(JSON.stringify({ 
        hasActiveSubscription: false,
        subscription: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    console.error("General error in check-subscription:", error);
    
    // Return a 200 response with error information rather than a 400
    // This ensures the client doesn't get error cascade
    return new Response(JSON.stringify({ 
      hasActiveSubscription: false,
      subscription: null,
      error: error.message,
      errorType: "function_error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 even on error to prevent cascading failures
    });
  }
});
