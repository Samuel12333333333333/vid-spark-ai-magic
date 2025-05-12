
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
    console.log("Get payment methods function called");
    
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY is not set");
      throw new Error("Paystack secret key is not configured");
    }

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

    console.log("Getting payment methods for user:", user.id);

    // Get the customer authorization code from the subscriptions table
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("paystack_customer_code, paystack_card_signature")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!subscription?.paystack_customer_code) {
      // No stored authorization found
      return new Response(JSON.stringify({ paymentMethods: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Use the authorization code to fetch the card details from Paystack if needed
    // For now, we'll return the stored information
    const paymentMethods = [{
      id: subscription.paystack_customer_code,
      brand: "card", // Paystack doesn't easily expose brand without additional API calls
      last4: "****", // We don't store this in our DB, would need additional API call
      expMonth: 0, // Not stored
      expYear: 0, // Not stored
      isDefault: true,
    }];

    return new Response(JSON.stringify({ paymentMethods }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return new Response(JSON.stringify({ error: error.message, paymentMethods: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 instead of error to prevent UI issues
    });
  }
});
