
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
    
    const apiKey = Deno.env.get("SHOTSTACK_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, message: "SHOTSTACK_API_KEY not found in environment variables" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Test connection by calling the API status endpoint
    const response = await fetch("https://api.shotstack.io/stage/demo/status", {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    console.log(`Shotstack API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shotstack render API error: ${response.status} ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `API Error: ${response.status} ${response.statusText}`,
          details: errorText
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
      );
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Shotstack API connection successful", 
        data 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error testing Shotstack API:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Error testing Shotstack API", 
        error: error.message || "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
