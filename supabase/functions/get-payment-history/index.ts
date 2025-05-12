
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the JWT token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error(userError?.message || 'Authentication failed');
    }

    // Get the user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // If no subscription exists, return empty payment history
    if (!subscription || !subscription.paystack_customer_code) {
      return new Response(
        JSON.stringify({ paymentHistory: [] }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    // Get payment history from notifications table
    const { data: payments } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'payment')
      .order('created_at', { ascending: false });
    
    // Format the payment history
    const paymentHistory = (payments || []).map(payment => {
      return {
        id: payment.id,
        amount: payment.metadata?.amount || 0,
        status: 'succeeded',
        created: new Date(payment.created_at).getTime() / 1000,
        receiptUrl: null
      };
    });

    return new Response(
      JSON.stringify({ paymentHistory }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
