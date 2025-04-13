
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
  });

  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature provided" }), {
      status: 400,
    });
  }

  // Get request body as text for the verification
  const body = await req.text();
  
  let event;
  try {
    // Use webhook secret to verify the event
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || "",
    );
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
      status: 400,
    });
  }

  // Create Supabase admin client
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    {
      auth: {
        persistSession: false,
      },
    }
  );

  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        
        // Create a subscription record in your database
        if (session.metadata?.userId) {
          const subscriptionData = {
            user_id: session.metadata.userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan_name: session.metadata.plan || "pro",
            status: "active",
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days until we get the actual info
          };
          
          // Insert the subscription data
          const { error } = await supabaseAdmin
            .from("subscriptions")
            .upsert(subscriptionData, { onConflict: "user_id" });
            
          if (error) {
            console.error("Error inserting subscription:", error);
          }
        }
        break;
        
      case "customer.subscription.updated":
      case "customer.subscription.created":
        const subscription = event.data.object;
        
        // Find the user by Stripe customer ID
        const { data: customers } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", subscription.customer)
          .limit(1);
          
        if (customers && customers.length > 0) {
          const userId = customers[0].user_id;
          
          // Update subscription status and end date
          const { error } = await supabaseAdmin
            .from("subscriptions")
            .update({
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000),
              stripe_subscription_id: subscription.id,
            })
            .eq("user_id", userId);
            
          if (error) {
            console.error("Error updating subscription:", error);
          }
        }
        break;
        
      case "customer.subscription.deleted":
        const canceledSubscription = event.data.object;
        
        // Mark the subscription as inactive
        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", canceledSubscription.id);
          
        if (error) {
          console.error("Error canceling subscription:", error);
        }
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
