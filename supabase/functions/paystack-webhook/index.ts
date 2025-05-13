import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import * as crypto from "https://deno.land/std@0.168.0/crypto/mod.ts";

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
    console.log("Paystack webhook received");
    
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY is not set");
      throw new Error("Payment configuration error");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase environment variables are not properly set");
      throw new Error("Database configuration error");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get request body
    const body = await req.text();
    let event;
    
    try {
      event = JSON.parse(body);
      console.log("Event received:", event.event);
    } catch (error) {
      console.error("Error parsing webhook payload:", error);
      throw new Error("Invalid JSON payload");
    }

    // Verify webhook signature
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      console.error("No signature found in webhook request");
      // For testing, we'll continue without signature verification
      if (!Deno.env.get("TESTING_MODE")) {
        throw new Error("No signature found in webhook request");
      } else {
        console.log("TESTING_MODE enabled, continuing without signature verification");
      }
    } else {
      // Create HMAC using the secret key
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(paystackSecretKey),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
      );
      
      const mac = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(body)
      );
      
      const calculatedSignature = Array.from(new Uint8Array(mac))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
        
      // Verify signature
      if (signature !== calculatedSignature && !Deno.env.get("TESTING_MODE")) {
        console.error("Signature verification failed");
        console.log("Received signature:", signature);
        console.log("Calculated signature:", calculatedSignature);
        throw new Error("Invalid webhook signature");
      }
    }

    console.log("Processing webhook event:", event.event);

    // Handle different event types
    switch (event.event) {
      case "charge.success":
        await handleChargeSuccess(event.data, supabase);
        break;
      case "subscription.create":
        await handleSubscriptionCreated(event.data, supabase);
        break;
      case "subscription.disable":
        await handleSubscriptionDisabled(event.data, supabase);
        break;
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});

// Handle successful charge events
async function handleChargeSuccess(data, supabase) {
  console.log("Processing charge.success event", data);
  
  try {
    const { reference, metadata, authorization } = data;
    
    // Check if this is a subscription-related transaction
    if (!metadata || !metadata.userId || !metadata.plan) {
      console.log("Not a subscription related charge, skipping");
      return;
    }
    
    const userId = metadata.userId;
    const planName = metadata.plan;
    
    console.log(`Successful payment for user ${userId} on plan ${planName}`);
    
    // Calculate subscription end date (30 days from now)
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30); // 30 days subscription
    
    // Check if the user already has a subscription
    const { data: existingSub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (fetchError) {
      console.error("Error fetching existing subscription:", fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }
      
    const cardSignature = authorization?.signature || null;
    
    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_name: planName,
          status: 'active',
          current_period_end: currentPeriodEnd.toISOString(),
          paystack_card_signature: cardSignature,
          paystack_customer_code: data.customer?.customer_code || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id);
        
      if (updateError) {
        console.error("Error updating subscription:", updateError);
        throw updateError;
      }
      
      console.log(`Updated subscription for user ${userId} to plan ${planName}`);
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_name: planName,
          status: 'active',
          current_period_end: currentPeriodEnd.toISOString(),
          paystack_card_signature: cardSignature,
          paystack_customer_code: data.customer?.customer_code || null
        });
        
      if (insertError) {
        console.error("Error creating subscription:", insertError);
        throw insertError;
      }
      
      console.log(`Created new subscription for user ${userId} on plan ${planName}`);
    }
    
    // Create notification for user
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: "Payment Successful",
        message: `Your payment for the ${planName} plan was successful. Your subscription is now active.`,
        type: "payment",
        is_read: false,
        metadata: {
          plan: planName,
          reference: reference
        }
      });
      
    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Don't throw error here as main subscription flow was successful
    }
      
  } catch (error) {
    console.error("Error handling charge.success:", error);
    throw error;
  }
}

// Handle subscription created events
async function handleSubscriptionCreated(data, supabase) {
  console.log("Processing subscription.create event", data);
  try {
    // Implementation would go here
    // This typically would update the subscription status in the database
    // For Paystack, their subscription model might have different data compared to Stripe
    console.log("Subscription created event received but not fully implemented yet");
  } catch (error) {
    console.error("Error handling subscription.create:", error);
  }
}

// Handle subscription disabled events
async function handleSubscriptionDisabled(data, supabase) {
  console.log("Processing subscription.disable event", data);
  try {
    const { subscription_code, email } = data;
    
    if (!email) {
      console.error("No email found in subscription disable event");
      return;
    }
    
    // Find the user with this email
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (userError || !userData) {
      console.error("Error finding user by email:", userError);
      return;
    }
    
    const userId = userData.id;
    
    // Update the subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');
      
    if (updateError) {
      console.error("Error updating subscription status:", updateError);
      return;
    }
    
    // Create notification for user
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: "Subscription Disabled",
        message: "Your subscription has been disabled.",
        type: "subscription",
        is_read: false,
        metadata: {
          subscription_code: subscription_code
        }
      });
      
    console.log(`Disabled subscription for user ${userId}`);
  } catch (error) {
    console.error("Error handling subscription.disable:", error);
  }
}
