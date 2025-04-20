
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { renderId } = await req.json();
    console.log(`Received check-render-status request for renderId: ${renderId}`);

    if (!renderId) {
      return new Response(
        JSON.stringify({ error: "Render ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // For real render IDs, check with Shotstack
    const API_KEY = Deno.env.get("SHOTSTACK_API_KEY");
    
    if (!API_KEY) {
      console.log("SHOTSTACK_API_KEY is not defined");
      return new Response(
        JSON.stringify({ error: "Shotstack API key is not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Call Shotstack API to check render status
    const response = await fetch(`https://api.shotstack.io/v1/render/${renderId}`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from Shotstack API: ${response.status} ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `Shotstack API error: ${response.status} ${response.statusText}`,
          details: errorText
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
      );
    }

    const data = await response.json();
    console.log("Shotstack API response:", JSON.stringify(data));

    if (!data.response) {
      return new Response(
        JSON.stringify({ error: "Invalid response from Shotstack API" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Return the render status and URL if available
    return new Response(
      JSON.stringify({
        status: data.response.status,
        url: data.response.url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
