
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const createNotification = async (supabaseAdmin, userId, title, message, type = 'payment', metadata = {}) => {
  try {
    // Add a deduplication key based on event type and timestamp to avoid duplicates
    const deduplicationKey = `${type}_${new Date().toISOString().split('T')[0]}_${metadata.event || ''}`;
    
    // Check if a similar notification was sent recently (within last hour)
    const { data: existingNotifications } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('title', title)
      .eq('type', type)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
      .limit(1);
      
    if (existingNotifications && existingNotifications.length > 0) {
      console.log("Similar notification found recently, skipping to avoid duplicates");
      return;
    }
    
    // Include metadata with deduplication key for better tracking
    const notification = {
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      metadata: { ...metadata, deduplication_key: deduplicationKey }
    };
    
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert([notification]);
      
    if (error) {
      console.error("Error creating notification:", error);
    } else {
      console.log("Notification created successfully");
    }
  } catch (error) {
    console.error("Exception creating notification:", error);
  }
};

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
  });

  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    console.error("No signature provided");
    return new Response(JSON.stringify({ error: "No signature provided" }), {
      status: 400,
    });
  }

  // Get request body as text for the verification
  const body = await req.text();
  console.log("Webhook received, verifying signature");
  
  let event;
  try {
    // Use webhook secret to verify the event
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      endpointSecret,
    );
    console.log("Webhook signature verified, event type:", event.type);
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
        console.log("Checkout session completed:", session.id);
        
        // Create a subscription record in your database
        if (session.metadata?.userId) {
          // First check if user already has a subscription
          const { data: existingSubscription } = await supabaseAdmin
            .from("subscriptions")
            .select("*")
            .eq("user_id", session.metadata.userId)
            .single();
          
          const subscriptionData = {
            user_id: session.metadata.userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan_name: session.metadata.plan || "pro",
            status: "active",
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days until we get the actual info
          };
          
          console.log("Processing subscription data:", subscriptionData);
          
          if (existingSubscription) {
            // Update existing subscription
            const { error } = await supabaseAdmin
              .from("subscriptions")
              .update(subscriptionData)
              .eq("user_id", session.metadata.userId);
              
            if (error) {
              console.error("Error updating subscription:", error);
            } else {
              console.log("Subscription updated successfully");
              
              // Create notification for subscription renewal
              await createNotification(
                supabaseAdmin,
                session.metadata.userId,
                "Subscription Renewed",
                `Your ${subscriptionData.plan_name} plan subscription has been renewed successfully.`,
                'payment',
                { event: 'renewal', plan: subscriptionData.plan_name }
              );
            }
          } else {
            // Insert new subscription
            const { error } = await supabaseAdmin
              .from("subscriptions")
              .insert(subscriptionData);
              
            if (error) {
              console.error("Error inserting subscription:", error);
            } else {
              console.log("Subscription created successfully");
              
              // Create notification for new subscription
              await createNotification(
                supabaseAdmin, 
                session.metadata.userId,
                "Subscription Activated",
                `Your ${subscriptionData.plan_name} plan subscription has been activated successfully.`,
                'payment',
                { event: 'new_subscription', plan: subscriptionData.plan_name }
              );
              
              // Reset video usage for this user when they subscribe
              await supabaseAdmin.rpc('reset_video_usage', { 
                user_id_param: session.metadata.userId 
              }).then(result => {
                console.log("Reset video usage for new subscriber:", result);
              });
            }
          }
        }
        break;
        
      case "customer.subscription.updated":
      case "customer.subscription.created":
        const subscription = event.data.object;
        console.log("Subscription updated/created:", subscription.id);
        
        // Find the user by Stripe customer ID
        const { data: customers, error: customerError } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", subscription.customer)
          .limit(1);
          
        if (customerError) {
          console.error("Error finding customer:", customerError);
          break;
        }
          
        if (customers && customers.length > 0) {
          const userId = customers[0].user_id;
          console.log("Found user for subscription:", userId);
          
          // Determine plan name
          let planName = "pro"; // Default
          
          const { data: priceData } = await stripe.prices.retrieve(
            subscription.items.data[0].price.id
          );
          
          if (priceData.product) {
            const { data: productData } = await stripe.products.retrieve(
              priceData.product.toString()
            );
            
            if (productData.name.toLowerCase().includes("business")) {
              planName = "business";
            }
          }
          
          // Update subscription status and end date
          const { error } = await supabaseAdmin
            .from("subscriptions")
            .update({
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000),
              stripe_subscription_id: subscription.id,
              plan_name: planName
            })
            .eq("user_id", userId);
            
          if (error) {
            console.error("Error updating subscription:", error);
          } else {
            console.log("Subscription updated successfully");
            
            // Create notification
            let notificationTitle = "Subscription Updated";
            let notificationMessage = `Your ${planName} plan subscription has been updated.`;
            let eventType = 'update';
            
            if (event.type === "customer.subscription.created") {
              notificationTitle = "Subscription Started";
              notificationMessage = `Your ${planName} plan subscription has been activated.`;
              eventType = 'new';
            }
            
            await createNotification(
              supabaseAdmin,
              userId,
              notificationTitle,
              notificationMessage,
              'payment',
              { event: eventType, plan: planName }
            );
            
            // Reset the usage count when subscription is created/updated
            await supabaseAdmin.rpc('reset_video_usage', { 
              user_id_param: userId 
            }).then(result => {
              console.log("Reset video usage after subscription update:", result);
            });
          }
        } else {
          console.error("No user found for customer:", subscription.customer);
        }
        break;
        
      case "customer.subscription.deleted":
        const canceledSubscription = event.data.object;
        console.log("Subscription canceled:", canceledSubscription.id);
        
        // Find the user by subscription ID
        const { data: subUsers, error: subUserError } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", canceledSubscription.id)
          .limit(1);
          
        if (subUserError) {
          console.error("Error finding subscription user:", subUserError);
          break;
        }
        
        if (subUsers && subUsers.length > 0) {
          const userId = subUsers[0].user_id;
          console.log("Found user for canceled subscription:", userId);
          
          // Mark the subscription as inactive
          const { error } = await supabaseAdmin
            .from("subscriptions")
            .update({ status: "canceled" })
            .eq("user_id", userId);
            
          if (error) {
            console.error("Error canceling subscription:", error);
          } else {
            console.log("Subscription canceled successfully");
            
            // Create notification
            await createNotification(
              supabaseAdmin,
              userId,
              "Subscription Canceled",
              "Your subscription has been canceled.",
              'payment',
              { event: 'canceled' }
            );
          }
        } else {
          console.error("No user found for subscription:", canceledSubscription.id);
        }
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
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
