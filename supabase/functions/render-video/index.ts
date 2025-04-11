
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
      throw new Error("SHOTSTACK_API_KEY is not defined");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error("Supabase credentials are not defined");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { scenes, userId, projectId } = await req.json();
    
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return new Response(
        JSON.stringify({ error: "Scenes array is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!userId || !projectId) {
      return new Response(
        JSON.stringify({ error: "User ID and Project ID are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Rendering video for project ${projectId} with ${scenes.length} scenes`);

    // Calculate total duration for reference
    const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
    console.log(`Total video duration: ${totalDuration} seconds`);

    // Create Shotstack timeline from scenes
    const timeline = {
      soundtrack: {
        src: "https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/music/unminus/lit.mp3",
        effect: "fadeOut"
      },
      background: "#000000",
      tracks: [
        // Video track
        {
          clips: scenes.map((scene, index) => {
            // Calculate start position based on previous scenes
            const startPosition = scenes
              .slice(0, index)
              .reduce((sum, s) => sum + s.duration, 0);
            
            return {
              asset: {
                type: "video",
                src: scene.videoUrl
              },
              start: startPosition,
              length: scene.duration,
              effect: index % 2 === 0 ? "zoomIn" : "slideUp", // Alternate effects for visual interest
              transition: {
                in: index === 0 ? "fade" : "fade",
                out: index === scenes.length - 1 ? "fade" : "fade"
              },
              fit: "cover"
            };
          })
        },
        // Text overlay track
        {
          clips: scenes.map((scene, index) => {
            // Calculate start position based on previous scenes
            const startPosition = scenes
              .slice(0, index)
              .reduce((sum, s) => sum + s.duration, 0);
            
            return {
              asset: {
                type: "title",
                text: scene.scene,
                style: "minimal",
                size: "medium",
                position: "bottom"
              },
              start: startPosition,
              length: scene.duration
            };
          })
        }
      ]
    };

    const output = {
      format: "mp4",
      resolution: "sd",
      aspectRatio: "16:9"
    };

    const shotstackPayload = {
      timeline,
      output,
      callback: null // Optional webhook URL could be configured here
    };

    console.log("Sending request to Shotstack API");

    // Call Shotstack API to render the video
    const response = await fetch("https://api.shotstack.io/stage/render", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
      },
      body: JSON.stringify(shotstackPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Shotstack API error response:", errorText);
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const renderId = data.response.id;
    console.log("Shotstack render ID:", renderId);

    // Update the project in Supabase with the render ID
    const { error: updateError } = await supabase
      .from("video_projects")
      .update({
        render_id: renderId,
        status: "processing"
      })
      .eq("id", projectId);
      
    if (updateError) {
      console.error("Error updating project in database:", updateError);
      // Still continue since we have the render ID to return
    }

    return new Response(
      JSON.stringify({ 
        renderId,
        estimatedDuration: totalDuration
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
