
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
    console.log("Get payment history function called");
    
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

    console.log("Getting payment history for user:", user.id);

    try {
      // Fetch transactions from Paystack by customer email
      const response = await fetch(`https://api.paystack.co/transaction?customer=${encodeURIComponent(user.email)}&perPage=25`, {
        headers: {
          "Authorization": `Bearer ${paystackSecretKey}`,
        }
      });
      
      if (!response.ok) {
        throw new Error(`Paystack API error: ${response.status}`);
      }
      
      const paystackData = await response.json();
      
      if (!paystackData.status) {
        throw new Error(paystackData.message || "Failed to fetch transactions");
      }
      
      // Format transactions into payment history
      const paymentHistory = paystackData.data.map(transaction => ({
        id: transaction.id,
        amount: transaction.amount, // Amount in kobo (smallest currency unit)
        status: transaction.status === "success" ? "succeeded" : transaction.status,
        date: new Date(transaction.paid_at || transaction.created_at),
        created: new Date(transaction.created_at).getTime() / 1000,
        receiptUrl: null, // Paystack doesn't provide receipt URLs
      }));

      return new Response(JSON.stringify({ paymentHistory }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (apiError) {
      console.error("Error fetching from Paystack:", apiError);
      // Return empty payment history with a warning message
      return new Response(JSON.stringify({ 
        paymentHistory: [],
        warning: `Could not retrieve payment history: ${apiError.message}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 instead of error to prevent UI issues
      });
    }
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      paymentHistory: [] // Return empty array to prevent UI issues
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 instead of error to prevent UI issues
    });
  }
});
