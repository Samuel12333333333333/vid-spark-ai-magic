
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
    
    // For direct key validation, use a more reliable endpoint that doesn't require permissions
    const endpoint = directTest 
      ? "https://api.shotstack.io/v1/me" 
      : "https://api.shotstack.io/v1/templates";
    
    console.log(`Testing Shotstack API with endpoint: ${endpoint}`);
    
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
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Shotstack API response:", JSON.stringify(data).substring(0, 200) + "...");
    
    // Verify that the API key is valid by checking specific properties in the response
    if (directTest) {
      // For /me endpoint, check if we have credits info
      if (!data.response || !data.response.credits) {
        throw new Error("Invalid Shotstack API key (no credits information returned)");
      }
    } else {
      // For templates endpoint, check if we have a data array
      if (!data.response || !data.response.data) {
        throw new Error("Invalid Shotstack API key (no template data returned)");
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Shotstack API connection successful",
        data: { 
          response: directTest 
            ? { status: "success", credits: data.response.credits } 
            : { status: "success", templates: data.response.data.length }
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
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
