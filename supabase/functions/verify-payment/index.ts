
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    console.log("Verify payment function called");

    // Get the auth header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    // Get the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: userError?.message || 'Authentication failed' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    // Get the request body containing the reference
    const requestBody = await req.json();
    const { reference } = requestBody;

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Payment reference is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Verifying payment reference:", reference);

    // Check if Paystack secret key is set
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY is missing");
      return new Response(
        JSON.stringify({ error: "Payment configuration error - API key missing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Verify the transaction with Paystack
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      });

      console.log("Paystack verification response status:", response.status);
      
      // Get response text for logging
      const responseText = await response.text();
      console.log("Paystack verification raw response:", responseText);
      
      // Parse the response as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Error parsing response:", e);
        return new Response(
          JSON.stringify({ error: "Invalid response from payment provider" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      if (!result.status) {
        console.error("Paystack verification error:", result);
        return new Response(
          JSON.stringify({ 
            status: "failed", 
            message: result.message || "Payment verification failed" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Check if payment was successful
      if (result.data.status === "success") {
        console.log("Payment verified successfully");

        // Get transaction metadata
        const metadata = result.data.metadata || {};
        const plan = metadata.plan || "pro"; // Default to pro if not specified
        const userId = metadata.userId || user.id;

        // Calculate subscription end date (30 days from now)
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30); // 30 days subscription

        // Update or create subscription record
        const { data: existingSub, error: fetchError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (fetchError) {
          console.error("Error fetching existing subscription:", fetchError);
          throw new Error(`Database error: ${fetchError.message}`);
        }

        const authorization = result.data.authorization;
        const cardSignature = authorization?.signature || null;

        if (existingSub) {
          // Update existing subscription
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              plan_name: plan,
              status: 'active',
              current_period_end: currentPeriodEnd.toISOString(),
              paystack_card_signature: cardSignature,
              paystack_customer_code: result.data.customer?.customer_code || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSub.id);
            
          if (updateError) {
            console.error("Error updating subscription:", updateError);
            throw updateError;
          }
          
          console.log(`Updated subscription for user ${userId} to plan ${plan}`);
        } else {
          // Create new subscription
          const { error: insertError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              plan_name: plan,
              status: 'active',
              current_period_end: currentPeriodEnd.toISOString(),
              paystack_card_signature: cardSignature,
              paystack_customer_code: result.data.customer?.customer_code || null
            });
            
          if (insertError) {
            console.error("Error creating subscription:", insertError);
            throw insertError;
          }
          
          console.log(`Created new subscription for user ${userId} on plan ${plan}`);
        }

        return new Response(
          JSON.stringify({ 
            status: "success",
            message: "Payment verified successfully",
            data: {
              plan: plan,
              amount: result.data.amount / 100, // Convert from kobo to naira
              reference: reference
            }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            status: "failed",
            message: `Payment verification failed: ${result.data.status}`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    } catch (fetchError) {
      console.error("Error fetching from Paystack:", fetchError);
      return new Response(
        JSON.stringify({ error: `Payment gateway error: ${fetchError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Something went wrong" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
