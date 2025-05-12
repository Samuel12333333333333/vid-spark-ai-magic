
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Retrieve the request's body
    const body = await req.json();
    console.log("Paystack webhook received:", JSON.stringify(body, null, 2));
    
    // Get Paystack secret key for signature verification
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      throw new Error("PAYSTACK_SECRET_KEY not set");
    }

    // Create Supabase client with service role key (admin privileges)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase admin credentials not available");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false
      }
    });
    
    console.log("Paystack webhook received:", {
      event: body.event,
      reference: body.data?.reference,
    });
    
    // Process different event types
    switch (body.event) {
      case 'charge.success': {
        // Handle successful payment
        await handleSuccessfulCharge(body.data, supabase);
        break;
      }
      
      case 'subscription.create': {
        // Handle new subscription creation
        await handleSubscriptionCreate(body.data, supabase);
        break;
      }
      
      case 'subscription.disable': {
        // Handle subscription cancellation
        await handleSubscriptionDisable(body.data, supabase);
        break;
      }
      
      case 'invoice.payment_failed': {
        // Handle failed payment
        await handlePaymentFailed(body.data, supabase);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${body.event}`);
    }
    
    // Return a success response to Paystack
    return new Response(
      JSON.stringify({ status: 'success' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error) {
    console.error('Error processing Paystack webhook:', error);
    
    // Return an error response
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

// Helper function to handle successful charge events
async function handleSuccessfulCharge(data, supabase) {
  try {
    console.log("Processing successful charge:", data.reference);
    
    // Extract user ID and plan from metadata
    const userId = data.metadata?.userId;
    const plan = data.metadata?.plan;
    
    if (!userId || !plan) {
      console.error("Missing userId or plan in metadata:", data.metadata);
      return;
    }
    
    const planName = plan.toLowerCase() === "pro" ? "Pro" : "Business";
    const now = new Date();
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // Add 1 month
    
    console.log(`Creating/updating subscription for user ${userId}, plan ${planName}`);
    
    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (existingSubscription) {
      // Update existing subscription
      await supabase
        .from('subscriptions')
        .update({
          plan_name: planName,
          status: 'active',
          current_period_end: currentPeriodEnd.toISOString(),
          updated_at: now.toISOString(),
          paystack_customer_code: data.customer?.customer_code,
          paystack_card_signature: data.authorization?.signature,
          paystack_plan_code: data.plan?.plan_code,
          paystack_subscription_code: data.subscription?.subscription_code
        })
        .eq('id', existingSubscription.id);
    } else {
      // Create new subscription
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_name: planName,
          status: 'active',
          current_period_end: currentPeriodEnd.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          paystack_customer_code: data.customer?.customer_code,
          paystack_card_signature: data.authorization?.signature,
          paystack_plan_code: data.plan?.plan_code,
          paystack_subscription_code: data.subscription?.subscription_code
        });
    }
    
    // Create a notification for the user
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Payment Successful',
        message: `Your payment for the ${planName} plan was successful.`,
        type: 'payment',
        metadata: {
          reference: data.reference,
          plan: planName,
          amount: data.amount / 100
        }
      });
      
    console.log(`Subscription for user ${userId} processed successfully`);
  } catch (error) {
    console.error("Error handling successful charge:", error);
    throw error;
  }
}

// Handle subscription creation
async function handleSubscriptionCreate(data, supabase) {
  try {
    console.log("Processing subscription creation:", JSON.stringify(data, null, 2));
    
    // Extract necessary data
    const customerCode = data.customer?.customer_code;
    const planCode = data.plan?.plan_code;
    const subscriptionCode = data.subscription_code;
    const email = data.customer?.email;
    
    if (!customerCode || !email) {
      console.error("Missing customer information:", data);
      return;
    }
    
    // Find the user by email
    const { data: users, error: usersError } = await supabase
      .auth.admin.listUsers();
      
    if (usersError || !users || users.users.length === 0) {
      console.error("Error fetching users:", usersError);
      return;
    }
    
    // Find the user with the matching email
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error("User not found for email:", email);
      return;
    }
    
    const userId = user.id;
    
    // Determine plan name based on plan code
    let planName;
    if (planCode === "PLN_h6tsrxea7rzn5x9") {
      planName = "Pro";
    } else if (planCode === "PLN_2e5qkue1lz5a48g") {
      planName = "Business";
    } else {
      planName = "Unknown";
    }
    
    const now = new Date();
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // Add 1 month
    
    // Update or create subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
      
    if (existingSubscription) {
      await supabase
        .from('subscriptions')
        .update({
          plan_name: planName,
          status: 'active',
          current_period_end: currentPeriodEnd.toISOString(),
          updated_at: now.toISOString(),
          paystack_customer_code: customerCode,
          paystack_plan_code: planCode,
          paystack_subscription_code: subscriptionCode
        })
        .eq('id', existingSubscription.id);
    } else {
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_name: planName,
          status: 'active',
          current_period_end: currentPeriodEnd.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          paystack_customer_code: customerCode,
          paystack_plan_code: planCode,
          paystack_subscription_code: subscriptionCode
        });
    }
  } catch (error) {
    console.error("Error handling subscription creation:", error);
  }
}

// Handle subscription disable/cancellation
async function handleSubscriptionDisable(data, supabase) {
  try {
    console.log("Processing subscription disable:", data);
    
    // Find the subscription by subscription code
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paystack_subscription_code', data.subscription_code)
      .maybeSingle();
    
    if (subscription) {
      // Update subscription status
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
      
      // Create a notification for the user
      await supabase
        .from('notifications')
        .insert({
          user_id: subscription.user_id,
          title: 'Subscription Canceled',
          message: `Your ${subscription.plan_name} subscription has been canceled.`,
          type: 'payment',
          metadata: {
            plan: subscription.plan_name
          }
        });
    }
  } catch (error) {
    console.error("Error handling subscription disable:", error);
    throw error;
  }
}

// Handle failed payment
async function handlePaymentFailed(data, supabase) {
  try {
    console.log("Processing payment failure:", data);
    
    // Find the subscription by customer code
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paystack_customer_code', data.customer?.customer_code)
      .maybeSingle();
    
    if (subscription) {
      // Create a notification for the user
      await supabase
        .from('notifications')
        .insert({
          user_id: subscription.user_id,
          title: 'Payment Failed',
          message: `Your payment for the ${subscription.plan_name} plan failed. Please update your payment method.`,
          type: 'payment',
          metadata: {
            plan: subscription.plan_name
          }
        });
    }
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw error;
  }
}
