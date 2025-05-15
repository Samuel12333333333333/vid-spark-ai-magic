
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    console.log("Render video function called");
    
    // Initialize Shotstack client with API key
    const shotstackApiKey = Deno.env.get("SHOTSTACK_API_KEY");
    if (!shotstackApiKey) {
      console.error("SHOTSTACK_API_KEY is not set");
      throw new Error("Shotstack API key is not configured");
    }

    // Create Supabase client to update project status
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase environment variables are not set");
      throw new Error("Supabase configuration is missing");
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    let params;
    try {
      params = await req.json();
      console.log("Received render request with params:", JSON.stringify(params));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      throw new Error("Invalid request body");
    }
    
    const { 
      projectId, 
      prompt,
      scenes,
      style,
      audioUrl, 
      has_audio,
      has_captions,
      captionsFile,
      brandKit 
    } = params;
    
    // Validate required parameters
    if (!projectId) {
      throw new Error("Project ID is required");
    }
    
    // Check if scenes are provided, if not, we can't create the video
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      console.error("No valid scenes provided, cannot create video");
      throw new Error("No valid scenes provided for video creation");
    }
    
    console.log(`Creating video for project ${projectId} with ${scenes.length} scenes`);
    
    // Create Shotstack timeline
    const timeline = {
      background: "#000000",
      tracks: []
    };
    
    // Add scenes to timeline
    const videoClipTrack = { clips: [] };
    const captionTrack = has_captions ? { clips: [] } : null;
    
    // Process scenes to use stock videos - we'll use keywords from each scene
    // to find suitable stock videos if videoUrl is not already provided
    let currentTime = 0;
    const sceneDuration = 5; // Default duration per scene in seconds
    
    // Collect any scenes that have video URLs
    const validScenes = scenes.filter(scene => {
      // We need to handle both formats: scene.videoUrl and scene.media_url
      return scene.videoUrl || scene.media_url;
    });

    if (validScenes.length === 0) {
      // If no valid scenes, we can't proceed
      console.error("No valid video URLs found in scenes");
      throw new Error("No valid video URLs found in scenes. Please ensure each scene has a videoUrl property.");
    }

    console.log(`Found ${validScenes.length} scenes with valid video URLs`);
    
    // Create video clips for valid scenes
    validScenes.forEach((scene, index) => {
      const videoUrl = scene.videoUrl || scene.media_url;
      console.log(`Adding scene ${index} with video: ${videoUrl}`);
      
      // Add video clip
      videoClipTrack.clips.push({
        asset: {
          type: "video",
          src: videoUrl,
          trim: 0,
        },
        start: currentTime,
        length: scene.duration || sceneDuration,
        effect: "zoomIn",
        transition: {
          in: index === 0 ? "fade" : "slideLeft",
          out: index === (validScenes.length - 1) ? "fade" : null,
        }
      });
      
      // Add caption if enabled
      if (has_captions && captionTrack) {
        captionTrack.clips.push({
          asset: {
            type: "title",
            text: scene.scene || `Scene ${index + 1}`,
            style: "minimal",
            size: "small",
            position: "bottom"
          },
          start: currentTime,
          length: scene.duration || sceneDuration
        });
      }
      
      currentTime += (scene.duration || sceneDuration);
    });
    
    // Add tracks to timeline
    timeline.tracks.push(videoClipTrack);
    if (captionTrack && captionTrack.clips.length > 0) {
      timeline.tracks.push(captionTrack);
    }
    
    // Add audio if provided
    if (has_audio && audioUrl) {
      console.log("Adding audio to timeline:", audioUrl);
      timeline.soundtrack = {
        src: audioUrl,
        effect: "fadeOut"
      };
    }
    
    // Apply brand styling if provided
    if (brandKit) {
      console.log("Applying brand styling");
      // Brand styling logic would go here
    }
    
    // Create output configuration
    const output = {
      format: "mp4",
      resolution: "sd" // Standard definition (480p)
    };
    
    // Create full render request
    const renderRequest = {
      timeline,
      output,
      callback: null // Optional webhook URL can be added here
    };
    
    console.log("Sending render request to Shotstack API");
    
    // Validate the renderRequest
    if (!renderRequest.timeline || !renderRequest.timeline.tracks || renderRequest.timeline.tracks.length === 0) {
      throw new Error("Invalid render request: Missing tracks");
    }
    
    if (!renderRequest.timeline.tracks[0].clips || renderRequest.timeline.tracks[0].clips.length === 0) {
      throw new Error("Invalid render request: No clips in track");
    }
    
    // Call Shotstack API to render video
    const response = await fetch("https://api.shotstack.io/stage/render", {
      method: "POST",
      headers: {
        "x-api-key": shotstackApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(renderRequest),
    });
    
    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shotstack API error (${response.status}): ${errorText}`);
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Shotstack render response:", JSON.stringify(data));
    
    // Get render ID from response
    const renderId = data.response?.id;
    if (!renderId) {
      throw new Error("No render ID returned from Shotstack");
    }
    
    console.log(`Got render ID: ${renderId}, updating project`);
    
    // Update project with render ID and status
    try {
      const { error: updateError } = await supabaseClient
        .from("video_projects")
        .update({
          render_id: renderId,
          status: "processing",
          has_audio: Boolean(has_audio),
          has_captions: Boolean(has_captions),
          updated_at: new Date().toISOString()
        })
        .eq("id", projectId);
        
      if (updateError) {
        console.error("Error updating project:", updateError);
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
      // Continue execution even if DB update fails
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        renderId,
        message: "Video rendering started successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in render-video function:", error);
    
    // Try to update project status to failed if there's a projectId
    try {
      const { projectId } = await req.json().catch(() => ({}));
      if (projectId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
          await supabaseClient
            .from("video_projects")
            .update({
              status: "failed",
              error_message: error.message || "Unknown error during video rendering",
              updated_at: new Date().toISOString()
            })
            .eq("id", projectId);
        }
      }
    } catch (updateError) {
      console.error("Error updating project status:", updateError);
    }
    
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during video rendering",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
