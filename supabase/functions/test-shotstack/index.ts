
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
      console.error("SHOTSTACK_API_KEY is not configured in Supabase secrets");
      throw new Error("Shotstack API key is not configured");
    }

    console.log("Testing Shotstack API connection...");
    
    // Let's test the API status endpoint, which is a good indicator of API functionality
    const response = await fetch("https://api.shotstack.io/v1/me", {
      method: "GET",
      headers: {
        "x-api-key": shotstackApiKey,
        "Content-Type": "application/json",
      },
    });

    // Check for network failures first
    if (!response) {
      throw new Error("Network failure when connecting to Shotstack API");
    }

    // Check if the response is not ok (non-200 status)
    if (!response.ok) {
      const errorData = await response.text();
      const status = response.status;
      console.error(`Shotstack API error (${status}): ${errorData}`);
      
      if (status === 401 || status === 403) {
        throw new Error(`Shotstack API authentication failed: Invalid API key or insufficient permissions`);
      } else if (status === 429) {
        throw new Error("Shotstack API rate limit exceeded. Please try again later.");
      } else {
        throw new Error(`Shotstack API error: ${status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log("Shotstack API connection successful", data);

    // Check if the user has rendering credits
    let creditsMessage = "";
    if (data.response && data.response.plan) {
      const credits = data.response.plan.remainingCredits || 0;
      creditsMessage = `Available credits: ${credits}`;
      console.log("Credits available:", credits);
      
      if (credits <= 0) {
        console.warn("WARNING: No credits available for rendering");
        return new Response(
          JSON.stringify({
            success: false,
            error: "No rendering credits available. Please upgrade your Shotstack plan.",
            data
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Shotstack API connection is working. ${creditsMessage}`,
        data
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error testing Shotstack API:", error);
    
    // Create a more detailed error response with debugging info
    const errorDetails = {
      success: false,
      error: error.message || "An error occurred testing the Shotstack API",
      timestamp: new Date().toISOString(),
      apiKeyConfigured: Boolean(Deno.env.get("SHOTSTACK_API_KEY")),
      apiKeyFirstChars: Deno.env.get("SHOTSTACK_API_KEY") 
        ? `${Deno.env.get("SHOTSTACK_API_KEY")?.substring(0, 3)}...` 
        : "not set"
    };
    
    return new Response(
      JSON.stringify(errorDetails),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
