
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
    try {
      console.log(`Checking status of render ${renderId} with Shotstack API`);
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
        
        // Check for specific error types
        if (response.status === 403) {
          console.error("Shotstack API authorization error (403 Forbidden)");
          return new Response(
            JSON.stringify({ 
              error: "Shotstack API authorization error",
              details: "Your Shotstack account doesn't have permission to access this render.",
              message: errorText
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
          );
        } else if (response.status === 404) {
          console.error("Render ID not found in Shotstack (404 Not Found)");
          return new Response(
            JSON.stringify({ 
              error: "Render not found",
              details: "The requested render ID does not exist or has been deleted.",
              message: errorText
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
          );
        } else if (response.status === 429) {
          console.error("Shotstack API rate limit exceeded (429 Too Many Requests)");
          return new Response(
            JSON.stringify({ 
              error: "Rate limit exceeded",
              details: "Too many requests to the Shotstack API. Please try again later.",
              message: errorText
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
          );
        }
        
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

      // Check for error status
      if (data.response.status === 'failed') {
        console.error("Shotstack render failed:", data.response.error || "Unknown error");
        return new Response(
          JSON.stringify({
            status: "failed",
            error: data.response.error || "Video rendering failed"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    } catch (apiError) {
      console.error("Error checking render status with Shotstack API:", apiError);
      return new Response(
        JSON.stringify({ 
          error: "Error checking render status", 
          details: apiError.message 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in check-render-status function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
