
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// For Paystack webhook, we don't need CORS headers since it's a server-to-server request

serve(async (req) => {
  // We don't use CORS for webhooks since they're server-to-server
  try {
    // Get request body as text for verification
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    
    if (!signature) {
      console.error("No Paystack signature provided");
      return new Response(JSON.stringify({ error: "No signature provided" }), {
        status: 400,
      });
    }
    
    // Parse the JSON body
    const event = JSON.parse(body);
    console.log("Paystack webhook received, event type:", event.event);

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

    // Function to create notifications for users
    const createNotification = async (userId, title, message, type = 'payment', metadata = {}) => {
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

    // Handle the event types
    switch (event.event) {
      case "charge.success":
        // Handle successful charge
        const transaction = event.data;
        console.log("Payment successful:", transaction.reference);
        
        // Get the metadata from the transaction
        const metadata = transaction.metadata || {};
        const userId = metadata.userId;
        const planName = metadata.plan || "pro";
        
        if (!userId) {
          console.error("No userId in metadata");
          break;
        }

        // Create or update subscription record
        const authCode = transaction.authorization?.authorization_code;
        const cardSignature = transaction.authorization?.signature;
        
        if (!authCode) {
          console.error("No authorization code in transaction");
          break;
        }

        // First check if user already has a subscription
        const { data: existingSubscription } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .single();
        
        const subscriptionData = {
          user_id: userId,
          paystack_customer_code: authCode,
          paystack_card_signature: cardSignature,
          plan_name: planName,
          status: "active",
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        };
        
        console.log("Processing subscription data:", subscriptionData);
        
        if (existingSubscription) {
          // Update existing subscription
          const { error } = await supabaseAdmin
            .from("subscriptions")
            .update(subscriptionData)
            .eq("user_id", userId);
            
          if (error) {
            console.error("Error updating subscription:", error);
          } else {
            console.log("Subscription updated successfully");
            
            // Create notification for subscription renewal
            await createNotification(
              userId,
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
              userId,
              "Subscription Activated",
              `Your ${subscriptionData.plan_name} plan subscription has been activated successfully.`,
              'payment',
              { event: 'new_subscription', plan: subscriptionData.plan_name }
            );
            
            // Reset video usage for this user when they subscribe
            await supabaseAdmin.rpc('reset_video_usage', { 
              user_id_param: userId 
            }).then(result => {
              console.log("Reset video usage for new subscriber:", result);
            });
          }
        }
        break;
      
      case "subscription.create":
        // Handle subscription creation (if using Paystack Subscriptions API)
        console.log("Subscription created:", event.data);
        break;
        
      case "subscription.disable":
        // Handle subscription cancellation
        const canceledSubscription = event.data;
        console.log("Subscription canceled:", canceledSubscription.id);
        
        // Find the user from subscription data
        if (canceledSubscription.customer && canceledSubscription.customer.email) {
          // Find user by email
          const { data: users } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", canceledSubscription.customer.email)
            .limit(1);
            
          if (users && users.length > 0) {
            const userId = users[0].id;
            
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
                userId,
                "Subscription Canceled",
                "Your subscription has been canceled.",
                'payment',
                { event: 'canceled' }
              );
            }
          }
        }
        break;
        
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
