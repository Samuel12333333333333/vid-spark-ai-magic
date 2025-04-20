import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Array of reliable sample videos to use in mock responses
const MOCK_VIDEOS = [
  "https://assets.mixkit.co/videos/preview/mixkit-spinning-around-the-earth-29351-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-daytime-city-traffic-aerial-view-56-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-with-coworker-in-the-office-27443-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-city-of-the-future-10084-large.mp4"
];

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { renderId } = await req.json();

    if (!renderId) {
      return new Response(
        JSON.stringify({ error: "Render ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Handle mock render IDs
    if (renderId.startsWith('mock-') || renderId.startsWith('error-mock-') || renderId.startsWith('error-fallback-')) {
      // Simulate rendering process using localStorage on the client side
      // This logic is in mediaService.checkRenderStatus for browser environment
      
      // For edge function, we'll just return a simulated status based on time
      const timestamp = parseInt(renderId.split('-').pop() || '0', 16) || Date.now();
      const elapsedSeconds = (Date.now() - timestamp) / 1000;
      
      // Pick a random mock video
      const mockVideoIndex = Math.floor(Math.random() * MOCK_VIDEOS.length);
      const mockVideoUrl = MOCK_VIDEOS[mockVideoIndex];
      
      // Simulate different statuses based on a simple time calculation
      let status = 'queued';
      let url = undefined;
      
      // Complete render after 10 seconds in edge function environment
      if (elapsedSeconds < 3) {
        status = 'queued';
      } else if (elapsedSeconds < 5) {
        status = 'fetching';
      } else if (elapsedSeconds < 8) {
        status = 'rendering';
      } else {
        status = 'done';
        url = mockVideoUrl;
      }
      
      return new Response(
        JSON.stringify({ status, url, isMock: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For real render IDs, check with Shotstack
    const API_KEY = Deno.env.get("SHOTSTACK_API_KEY");
    
    if (!API_KEY) {
      // Return mock data even for real IDs if API key is missing
      return new Response(
        JSON.stringify({ status: 'done', url: MOCK_VIDEOS[0], isMock: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase.functions.invoke("check-render-status", {
      body: { renderId }
    });
    
    if (error) {
      console.error("Error checking render status:", error);
      throw error;
    }
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
