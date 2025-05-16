
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
    const shotstackApiKey = Deno.env.get("SHOTSTACK_API_KEY");
    
    if (!shotstackApiKey) {
      throw new Error("Shotstack API key is not configured");
    }

    console.log("Testing Shotstack API connection...");
    
    // Test the me endpoint which is more reliable than /status which doesn't exist
    const response = await fetch("https://api.shotstack.io/v1/me", {
      method: "GET",
      headers: {
        "x-api-key": shotstackApiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Shotstack API error (${response.status}): ${errorData}`);
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Shotstack API test successful:", data);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Shotstack API connection is working",
        data
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error testing Shotstack API:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An error occurred testing the Shotstack API",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
