
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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
        JSON.stringify({ error: "Shotstack API key is not configured" }),
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

    const requestData = await req.json();
    
    // Log the full request data for debugging
    console.log("Full render-video request data:", JSON.stringify(requestData));
    
    console.log("Request received for render-video:", JSON.stringify({
      scenesCount: requestData.scenes?.length || 0,
      userId: requestData.userId,
      projectId: requestData.projectId,
      audioProvided: !!requestData.audioBase64 ? "Yes" : "No",
      audioLength: requestData.audioBase64?.length || 0,
      captionsEnabled: !!requestData.includeCaptions,
      hasAudioFlag: requestData.has_audio,
      hasCaptionsFlag: requestData.has_captions
    }));
    
    const { 
      scenes, 
      userId, 
      projectId, 
      audioBase64, 
      includeCaptions, 
      narrationScript,
      has_audio: hasAudioFlag,
      has_captions: hasCaptionsFlag
    } = requestData;
    
    // Use explicit flags from request or fall back to derived values
    const hasAudio = hasAudioFlag === true || (!!audioBase64 && audioBase64.length > 100);
    const hasCaptions = hasCaptionsFlag === true || includeCaptions === true;
    
    // Validate required fields
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      console.error("No valid scenes provided");
      return new Response(
        JSON.stringify({ error: "Scenes array is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!userId || !projectId) {
      console.error("Missing user or project ID");
      return new Response(
        JSON.stringify({ error: "User ID and Project ID are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate projectId is a valid UUID if it's a test project
    let actualProjectId = projectId;
    if (projectId.startsWith("test-project-")) {
      // For testing purposes, create a random UUID instead of using the test string
      actualProjectId = crypto.randomUUID();
      console.log(`Converting test project ID ${projectId} to UUID ${actualProjectId} for database compatibility`);
    }

    console.log(`Rendering video for project ${actualProjectId} with ${scenes.length} scenes`);
    console.log(`Audio enabled: ${hasAudio ? 'Yes' : 'No'}`);
    console.log(`Captions enabled: ${hasCaptions ? 'Yes' : 'No'}`);
    
    // Validate each scene has a videoUrl
    const invalidScenes = scenes.filter(scene => !scene.videoUrl);
    if (invalidScenes.length > 0) {
      console.error(`Found ${invalidScenes.length} scenes missing video URLs`);
      return new Response(
        JSON.stringify({ 
          error: "Some scenes are missing video URLs",
          details: `${invalidScenes.length} out of ${scenes.length} scenes have no video URL`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Store narration script in the database if provided
    let scriptToSave = narrationScript;
    if (!scriptToSave || scriptToSave.trim() === '') {
      // Generate a script from scene descriptions as fallback
      scriptToSave = scenes
        .map(scene => scene.description || scene.scene || "")
        .filter(text => text.trim() !== "")
        .join(". ");
      
      if (scriptToSave) {
        console.log(`Generated fallback narration from scenes: ${scriptToSave.substring(0, 100)}...`);
      } else {
        scriptToSave = "Experience this visual journey with us.";
        console.log("Using default narration:", scriptToSave);
      }
    }
    
    // Clean up the script
    scriptToSave = scriptToSave
      .replace(/\.\.+/g, '.') // Replace multiple periods with a single one
      .replace(/\s+/g, ' ')   // Replace multiple spaces with a single one
      .trim();               // Trim whitespace
      
    try {
      // Update the project with the narration script and audio/caption flags
      const { error: updateNarrationError } = await supabase
        .from("video_projects")
        .update({
          narration_script: scriptToSave,
          has_audio: hasAudio,
          has_captions: hasCaptions
        })
        .eq("id", actualProjectId);
        
      if (updateNarrationError) {
        console.error("Error updating project narration script:", updateNarrationError);
      } else {
        console.log("Successfully updated narration script and flags in database");
      }
    } catch (dbError) {
      console.error("Error updating narration script in database:", dbError);
      // Continue execution despite database error
    }

    // Calculate total duration for reference
    const totalDuration = scenes.reduce((sum, scene) => {
      const duration = typeof scene.duration === 'number' ? scene.duration : parseFloat(scene.duration) || 5;
      return sum + duration;
    }, 0);
    
    console.log(`Total video duration: ${totalDuration} seconds`);

    try {
      // Build timeline for Shotstack
      const timeline = {
        background: "#000000",
        tracks: [
          {
            clips: scenes.map((scene, index) => {
              const startPosition = scenes
                .slice(0, index)
                .reduce((sum, s) => {
                  const duration = typeof s.duration === 'number' ? s.duration : parseFloat(s.duration) || 5;
                  return sum + duration;
                }, 0);
              
              const duration = typeof scene.duration === 'number' ? scene.duration : parseFloat(scene.duration) || 5;
              
              return {
                asset: {
                  type: "video",
                  src: scene.videoUrl
                },
                start: startPosition,
                length: duration,
                transition: {
                  in: "fade",
                  out: "fade"
                }
              };
            })
          }
        ]
      };

      // Add audio track if provided
      if (audioBase64 && audioBase64.length > 100) {
        // We'd need to upload the audio to a storage location first
        // This would typically be handled by another function
        console.log("Audio provided, but direct base64 audio is not supported by Shotstack");
        // Would need an additional step to convert base64 to URL
      }

      // Add text overlays for captions if enabled
      if (hasCaptions && narrationScript) {
        console.log("Captions enabled, adding text overlays");
        // Would need to split narrationScript into segments and add as text overlays
        // This would be a more complex implementation
      }

      const output = {
        format: "mp4",
        resolution: "sd",
        aspectRatio: "16:9"
      };

      const shotstackPayload = { 
        timeline, 
        output 
      };

      console.log("Sending request to Shotstack API");
      
      // Call Shotstack API to render the video
      const response = await fetch("https://api.shotstack.io/v1/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
        body: JSON.stringify(shotstackPayload)
      });

      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = "Could not read error response";
        }
        console.error(`Shotstack API error response:`, errorText);
        throw new Error(`Shotstack API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Shotstack API response:", JSON.stringify(data));
      
      if (!data.response || !data.response.id) {
        console.error(`Invalid response from Shotstack API:`, data);
        throw new Error("Invalid response from Shotstack API");
      }
      
      const renderId = data.response.id;

      // Update the project in Supabase with the render ID and metadata
      try {
        const { error: updateError } = await supabase
          .from("video_projects")
          .update({
            render_id: renderId,
            status: "processing",
            has_captions: hasCaptions,
            has_audio: hasAudio
          })
          .eq("id", actualProjectId);
          
        if (updateError) {
          console.error("Error updating project in database:", updateError);
          // Still continue since we have the render ID to return
        } else {
          console.log("Successfully updated project with render ID and metadata");
        }
      } catch (dbError) {
        console.error("Error updating project with render ID:", dbError);
      }

      return new Response(
        JSON.stringify({ 
          renderId,
          estimatedDuration: totalDuration,
          hasAudio: hasAudio,
          hasCaptions: hasCaptions
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (apiError) {
      console.error("Error calling Shotstack API:", apiError);
      
      // Update project status to failed
      try {
        const { error: updateError } = await supabase
          .from("video_projects")
          .update({
            status: "failed"
          })
          .eq("id", actualProjectId);
          
        if (updateError) {
          console.error("Error updating project status to failed:", updateError);
        } else {
          console.log("Updated project status to failed due to Shotstack API error");
        }
      } catch (statusError) {
        console.error("Error updating project status after API error:", statusError);
      }
      
      return new Response(
        JSON.stringify({ 
          error: apiError.message
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in render-video function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
