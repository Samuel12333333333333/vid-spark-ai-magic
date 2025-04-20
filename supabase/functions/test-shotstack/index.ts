
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
      // Test creating a minimal valid timeline to ensure we can render videos
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

      const renderResponse = await fetch("https://api.shotstack.io/v1/render/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
        body: JSON.stringify(testTimeline)
      });

      if (!renderResponse.ok) {
        const errorText = await renderResponse.text();
        console.error(`Shotstack render API error: ${renderResponse.status}`, errorText);
        return new Response(
          JSON.stringify({ 
            error: "Error testing video rendering with Shotstack API",
            status: renderResponse.status,
            details: errorText
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const renderData = await renderResponse.json();
      
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
