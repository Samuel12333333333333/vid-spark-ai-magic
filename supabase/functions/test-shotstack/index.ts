
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // Get the API key from environment variables
    const shotstackApiKey = Deno.env.get("SHOTSTACK_API_KEY");
    if (!shotstackApiKey) {
      console.error("SHOTSTACK_API_KEY is not set");
      throw new Error("Shotstack API key is not configured");
    }

    // Use the proper Shotstack API endpoint to test the key
    // Instead of trying a /demo/status endpoint, we'll use their API status endpoint
    const response = await fetch("https://api.shotstack.io/stage/me", {
      method: "GET",
      headers: {
        "x-api-key": shotstackApiKey,
        "Content-Type": "application/json",
      },
    });

    // Process and return the response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shotstack API error (${response.status}): ${errorText}`);
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Shotstack API connection successful:", data);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Shotstack API connection successful",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error testing Shotstack API:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to connect to Shotstack API",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
