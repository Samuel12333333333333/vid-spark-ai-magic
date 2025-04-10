
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
        JSON.stringify({ error: "API key is missing. Please check your environment variables." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const { renderId } = await req.json();
    if (!renderId) {
      return new Response(
        JSON.stringify({ error: "Render ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Checking status for render ID: ${renderId}`);

    // Check status with Shotstack API
    const response = await fetch(`https://api.shotstack.io/stage/render/${renderId}`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shotstack API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Render status: ${data.response.status}`);

    // Transform the response
    const status = data.response.status;
    const url = status === "done" ? data.response.url : null;

    return new Response(
      JSON.stringify({ 
        status: status === "ready" ? "done" : status,
        url
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
