
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
        JSON.stringify({ error: "Shotstack API key is missing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Testing Shotstack API connection with new key...");
    
    // Test creating a minimal valid timeline
    const testTimeline = {
      timeline: {
        background: "#000000",
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: "title",
                  text: "API Test",
                  style: "minimal",
                  size: "medium"
                },
                start: 0,
                length: 2
              }
            ]
          }
        ]
      },
      output: {
        format: "mp4",
        resolution: "sd"
      }
    };

    try {
      const renderResponse = await fetch("https://api.shotstack.io/v1/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
        body: JSON.stringify(testTimeline)
      });

      console.log("Shotstack API response status:", renderResponse.status);
      
      if (!renderResponse.ok) {
        const errorText = await renderResponse.text();
        console.error(`Shotstack render API error: ${renderResponse.status}`, errorText);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Shotstack API test failed",
            status: renderResponse.status,
            details: errorText
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: renderResponse.status }
        );
      }

      const renderData = await renderResponse.json();
      console.log("Shotstack API render test successful:", JSON.stringify(renderData));
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Shotstack API is configured correctly and can render videos",
          data: { 
            renderTest: renderData
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (fetchError) {
      console.error("Error fetching from Shotstack API:", fetchError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to connect to Shotstack API", 
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
