
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const API_KEY = Deno.env.get("SHOTSTACK_API_KEY");
    if (!API_KEY) {
      console.error("SHOTSTACK_API_KEY is not defined");
      return new Response(
        JSON.stringify({ 
          error: "API key is missing. Please check your environment variables.",
          details: "The SHOTSTACK_API_KEY environment variable is not set."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Simple test request to Shotstack - just to check if the API key is valid
    try {
      const response = await fetch("https://api.shotstack.io/v1/me", {
        method: "GET",
        headers: {
          "x-api-key": API_KEY
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Shotstack API error: ${response.status}`, errorText);
        return new Response(
          JSON.stringify({ 
            error: "Error connecting to Shotstack API",
            status: response.status,
            details: errorText
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Shotstack API is configured correctly",
          data
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (fetchError) {
      console.error("Error fetching from Shotstack API:", fetchError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to connect to Shotstack API", 
          details: fetchError.message 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in test-shotstack function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
