
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
    console.log("Testing Shotstack API connection...");
    
    // Get API key from environment
    const shotstackApiKey = Deno.env.get("SHOTSTACK_API_KEY");
    if (!shotstackApiKey) {
      throw new Error("Shotstack API key is not configured");
    }

    // Parse request
    const params = await req.json().catch(() => ({}));
    const directTest = params?.direct === true;
    
    // For direct key validation, use a simpler endpoint
    const endpoint = directTest 
      ? "https://api.shotstack.io/v1/templates" 
      : "https://api.shotstack.io/v1/me";
    
    // Test if API key works by making a simple request
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "x-api-key": shotstackApiKey,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shotstack API error (${response.status}): ${errorText}`);
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Shotstack API connection successful",
        data: { 
          response: directTest ? { status: "success" } : data.response
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error testing Shotstack API:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Failed to test Shotstack API",
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
