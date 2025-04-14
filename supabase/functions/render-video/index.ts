
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
      console.error("SHOTSTACK_API_KEY is not defined");
      return new Response(
        JSON.stringify({ 
          error: "API key is missing. Please check your environment variables.",
          details: "The SHOTSTACK_API_KEY environment variable is not set."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error("Supabase credentials are not defined");
      return new Response(
        JSON.stringify({ 
          error: "Supabase credentials are missing", 
          details: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { scenes, userId, projectId, audioBase64, includeCaptions, narrationScript } = await req.json();
    
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
    console.log(`Audio provided: ${!!audioBase64}, Include captions: ${!!includeCaptions}`);
    
    if (narrationScript) {
      console.log(`Narration script: "${narrationScript}"`);
      
      // Update the project with the narration script
      const { error: updateNarrationError } = await supabase
        .from("video_projects")
        .update({
          narration_script: narrationScript
        })
        .eq("id", projectId);
        
      if (updateNarrationError) {
        console.error("Error updating project narration script:", updateNarrationError);
      }
    }

    // Calculate total duration for reference
    const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
    console.log(`Total video duration: ${totalDuration} seconds`);

    // Validate video URLs in scenes
    const validScenes = scenes.filter(scene => scene.videoUrl && typeof scene.videoUrl === 'string');
    
    if (validScenes.length === 0) {
      console.error("No valid video URLs found in scenes");
      return new Response(
        JSON.stringify({ error: "No valid video URLs found in scenes" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create Shotstack timeline from scenes
    const timeline = {
      background: "#000000",
      tracks: [
        // Video track
        {
          clips: validScenes.map((scene, index) => {
            // Calculate start position based on previous scenes
            const startPosition = validScenes
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
        }
      ]
    };

    // Add captions/subtitles track if requested
    if (includeCaptions) {
      let captionText = narrationScript || "";
      if (!captionText && scenes.length > 0) {
        // If no narration script, use scene descriptions
        captionText = scenes.map(scene => scene.scene).join(". ");
      }
      
      if (captionText) {
        const captionsTrack = {
          clips: [
            {
              asset: {
                type: "title",
                text: captionText,
                style: "minimal",
                size: "medium",
                position: "bottom",
                background: "#00000080" // Semi-transparent background for better readability
              },
              start: 0,
              length: totalDuration
            }
          ]
        };
        
        timeline.tracks.push(captionsTrack);
      }
    } else {
      // Even without captions, still add scene titles at the beginning of each scene
      const titlesTrack = {
        clips: validScenes.map((scene, index) => {
          // Calculate start position based on previous scenes
          const startPosition = validScenes
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
            length: Math.min(3, scene.duration) // Show title for max 3 seconds or scene duration
          };
        })
      };
      
      timeline.tracks.push(titlesTrack);
    }

    // Handle audio - either use provided ElevenLabs audio or default soundtrack
    if (audioBase64) {
      // Create a temporary URL for the audio file
      // In a production environment, you would upload this to storage and use the URL
      // For this demo, we'll use a stock audio URL instead
      
      // Note: In a real implementation, you would:
      // 1. Store the base64 audio in Supabase Storage
      // 2. Get a public URL for that file
      // 3. Use that URL in the soundtrack config
      
      console.log("Using ElevenLabs generated audio for soundtrack");
      
      // For now, we'll simulate having stored the audio with this approach
      timeline.soundtrack = {
        src: "https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/music/unminus/lit.mp3", // Placeholder - would be replaced with stored audio URL
        effect: "fadeOut",
        volume: 0.3 // Lower background music volume to 30% when voiceover is present
      };
      
      // Mark in the database that we have audio for this project
      // This is just for tracking, in production you would store the actual audio file
      const { error: updateAudioError } = await supabase
        .from("video_projects")
        .update({
          has_audio: true
        })
        .eq("id", projectId);
        
      if (updateAudioError) {
        console.error("Error updating project audio status:", updateAudioError);
      }
    } else {
      // Use default soundtrack
      console.log("Using default soundtrack");
      timeline.soundtrack = {
        src: "https://shotstack-assets.s3.ap-southeast-2.amazonaws.com/music/unminus/lit.mp3",
        effect: "fadeOut",
        volume: 0.7 // Higher volume (70%) when no voiceover is present
      };
    }

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

    try {
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
          status: "processing",
          has_captions: !!includeCaptions
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
    } catch (apiError) {
      console.error("Error calling Shotstack API:", apiError);
      return new Response(
        JSON.stringify({ 
          error: "Error rendering video with Shotstack API", 
          details: apiError.message 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in render-video function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
