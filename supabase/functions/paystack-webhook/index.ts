
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
      throw new Error("PAYSTACK_SECRET_KEY is not set");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not properly set");
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
      throw new Error("No signature found in webhook request");
    }

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
    if (signature !== calculatedSignature) {
      console.error("Signature verification failed");
      throw new Error("Invalid webhook signature");
    }

    console.log("Signature verified successfully");

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
      status: 400
    });
  }
});

// Handle successful charge events
async function handleChargeSuccess(data, supabase) {
  console.log("Processing charge.success event");
  
  try {
    const { reference, metadata } = data;
    
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
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_name: planName,
          status: 'active',
          current_period_end: currentPeriodEnd.toISOString(),
          paystack_card_signature: data.authorization?.signature || null,
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
          paystack_card_signature: data.authorization?.signature || null
        });
        
      if (insertError) {
        console.error("Error creating subscription:", insertError);
        throw insertError;
      }
      
      console.log(`Created new subscription for user ${userId} on plan ${planName}`);
    }
    
    // Create notification for user
    await supabase
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
      
  } catch (error) {
    console.error("Error handling charge.success:", error);
    throw error;
  }
}

// Handle subscription created events
async function handleSubscriptionCreated(data, supabase) {
  console.log("Processing subscription.create event");
  // Implementation if needed
}

// Handle subscription disabled events
async function handleSubscriptionDisabled(data, supabase) {
  console.log("Processing subscription.disable event");
  // Implementation if needed
}
