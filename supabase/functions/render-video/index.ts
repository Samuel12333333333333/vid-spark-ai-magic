
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

    const requestData = await req.json();
    console.log("Request received:", JSON.stringify({
      scenesCount: requestData.scenes?.length || 0,
      userId: requestData.userId,
      projectId: requestData.projectId,
      audioProvided: !!requestData.audioBase64,
      captionsEnabled: requestData.includeCaptions
    }));
    
    const { scenes, userId, projectId, audioBase64, includeCaptions, narrationScript } = requestData;
    
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

    console.log(`Rendering video for project ${projectId} with ${scenes.length} scenes`);
    console.log(`Audio provided: ${!!audioBase64}, Include captions: ${!!includeCaptions}`);
    
    // Store narration script in the database
    if (narrationScript) {
      console.log(`Narration script: "${narrationScript}"`);
      
      try {
        // Update the project with the narration script
        const { error: updateNarrationError } = await supabase
          .from("video_projects")
          .update({
            narration_script: narrationScript
          })
          .eq("id", projectId);
          
        if (updateNarrationError) {
          console.error("Error updating project narration script:", updateNarrationError);
        } else {
          console.log("Successfully updated narration script in database");
        }
      } catch (dbError) {
        console.error("Error updating narration script in database:", dbError);
      }
    }

    // Calculate total duration for reference
    const totalDuration = scenes.reduce((sum, scene) => {
      const duration = typeof scene.duration === 'number' ? scene.duration : parseFloat(scene.duration) || 5;
      return sum + duration;
    }, 0);
    
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

    // Create Shotstack timeline without background music
    const timeline = {
      background: "#000000",
      tracks: [
        // Video track
        {
          clips: validScenes.map((scene, index) => {
            // Calculate start position based on previous scenes
            const startPosition = validScenes
              .slice(0, index)
              .reduce((sum, s) => {
                const duration = typeof s.duration === 'number' ? s.duration : parseFloat(s.duration) || 5;
                return sum + duration;
              }, 0);
            
            // Ensure duration is a number
            const duration = typeof scene.duration === 'number' ? scene.duration : parseFloat(scene.duration) || 5;
            
            return {
              asset: {
                type: "video",
                src: scene.videoUrl
              },
              start: startPosition,
              length: duration,
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

    // Add captions/subtitles track if explicitly requested
    if (includeCaptions) {
      console.log("Adding captions to video");
      let captionTexts = [];
      
      // If we have narration script, split it into sentences
      if (narrationScript) {
        // Split narration into sentences and assign to scenes
        captionTexts = narrationScript.split(/[.!?]+\s*/).filter(text => text.trim() !== '');
        console.log(`Split narration script into ${captionTexts.length} caption segments`);
      } else {
        // Use scene descriptions if no narration script
        captionTexts = scenes.map(scene => scene.scene || scene.description || '').filter(text => text.trim() !== '');
        console.log(`Using ${captionTexts.length} scene descriptions as captions`);
      }
      
      if (captionTexts.length > 0) {
        // Add a separate track for captions
        timeline.tracks.push({
          clips: validScenes.map((scene, index) => {
            // Calculate start position based on previous scenes
            const startPosition = validScenes
              .slice(0, index)
              .reduce((sum, s) => {
                const duration = typeof s.duration === 'number' ? s.duration : parseFloat(s.duration) || 5;
                return sum + duration;
              }, 0);
            
            // Ensure duration is a number
            const duration = typeof scene.duration === 'number' ? scene.duration : parseFloat(scene.duration) || 5;
            
            // Get caption text for this scene (fallback to empty string if no text available)
            const captionText = index < captionTexts.length ? captionTexts[index] : 
                             (scene.scene || scene.description || '');
            
            return {
              asset: {
                type: "title",
                text: captionText,
                style: "minimal",
                size: "medium",
                position: "bottom",
                background: "#00000080" // Semi-transparent background for better readability
              },
              start: startPosition,
              length: duration
            };
          })
        });
      }
    }

    // Handle voiceover audio without background music
    if (audioBase64) {
      console.log("Using ElevenLabs generated audio for voiceover");
      
      try {
        // Create a temporary storage object for the audio
        const audioFileName = `audio-${projectId}-${Date.now()}.mp3`;
        
        // Convert base64 to Uint8Array
        const binaryString = atob(audioBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Upload audio file to Shotstack assets
        const formData = new FormData();
        formData.append('file', new Blob([bytes], { type: 'audio/mpeg' }), audioFileName);
        
        const uploadResponse = await fetch('https://api.shotstack.io/v1/assets/', {
          method: 'POST',
          headers: {
            'x-api-key': API_KEY
          },
          body: formData
        });
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(`Error uploading audio: ${uploadResponse.status} ${uploadResponse.statusText}`);
          console.error(`Response body: ${errorText}`);
          throw new Error(`Error uploading audio: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
        
        const uploadResult = await uploadResponse.json();
        console.log("Upload result:", JSON.stringify(uploadResult));
        
        if (!uploadResult.data || !uploadResult.data.url) {
          console.error("Invalid response from Shotstack asset upload:", uploadResult);
          throw new Error("Invalid response from audio upload");
        }
        
        const audioUrl = uploadResult.data.url;
        console.log("Audio uploaded successfully, URL:", audioUrl);
        
        // Use the uploaded audio URL in the soundtrack (voiceover only, no background music)
        timeline.soundtrack = {
          src: audioUrl,
          effect: "fadeOut",
          volume: 1.0 // Full volume for voiceover
        };
      } catch (audioUploadError) {
        console.error("Error uploading audio:", audioUploadError);
        // Continue without audio rather than failing the entire render
        console.log("Continuing video render without audio due to upload error");
      }
    }

    const output = {
      format: "mp4",
      resolution: "sd",
      aspectRatio: "16:9"
    };

    const shotstackPayload = {
      timeline,
      output,
      callback: null
    };

    console.log("Sending request to Shotstack API");
    console.log("Payload preview:", JSON.stringify({
      clipCount: timeline.tracks[0].clips.length,
      hasCaptions: timeline.tracks.length > 1,
      hasSoundtrack: !!timeline.soundtrack
    }));

    try {
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
        const errorText = await response.text();
        console.error("Shotstack API error response:", errorText);
        throw new Error(`Shotstack API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Shotstack API response:", JSON.stringify(data));
      
      if (!data.response || !data.response.id) {
        console.error("Invalid response from Shotstack API:", data);
        throw new Error("Invalid response from Shotstack API");
      }
      
      const renderId = data.response.id;
      console.log("Shotstack render ID:", renderId);

      // Update the project in Supabase with the render ID
      try {
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
        } else {
          console.log("Successfully updated project with render ID");
        }
      } catch (dbError) {
        console.error("Error updating project with render ID:", dbError);
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
