
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

    // Initialize Supabase client with service role key
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
      throw new Error(userError?.message || 'Authentication failed');
    }

    console.log("Checking subscription for user:", user.id);

    try {
      // Check if the user has an active subscription in the database
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();  // Changed from .single() to prevent errors when no subscription exists

      if (subError) {
        console.error("Error checking subscription:", subError);
        throw new Error(`Error checking subscription: ${subError.message}`);
      }

      // If there's a subscription and it's expired, update it
      if (subscription && subscription.current_period_end) {
        const endDate = new Date(subscription.current_period_end);
        const now = new Date();
        
        if (endDate < now) {
          console.log("Subscription has expired, updating status");
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id);
            
          if (updateError) {
            console.error("Error updating subscription status:", updateError);
          }
            
          return new Response(
            JSON.stringify({ 
              subscription: { ...subscription, status: 'expired' } 
            }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200 
            }
          );
        }
      }

      console.log("Returning subscription data:", subscription);

      // Return the subscription data
      return new Response(
        JSON.stringify({ 
          subscription: subscription || null
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    } catch (error) {
      console.error("Error in subscription check:", error);
      // Return null subscription but don't throw error to avoid breaking the app
      return new Response(
        JSON.stringify({ subscription: null }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
  } catch (error) {
    console.error("Error checking subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
