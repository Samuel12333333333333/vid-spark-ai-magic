
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
    console.log("Request received for render-video:", JSON.stringify({
      scenesCount: requestData.scenes?.length || 0,
      userId: requestData.userId,
      projectId: requestData.projectId,
      audioProvided: !!requestData.audioBase64 || "No audio provided",
      captionsEnabled: !!requestData.includeCaptions || false
    }));
    
    const { scenes, userId, projectId, audioBase64, includeCaptions, narrationScript } = requestData;
    
    // Validate required fields
    if (!scenes || !Array.isArray(scenes)) {
      console.error("No valid scenes provided");
      return new Response(
        JSON.stringify({ error: "Scenes array is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (scenes.length === 0) {
      console.error("Empty scenes array provided");
      return new Response(
        JSON.stringify({ error: "At least one scene is required" }),
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
    
    console.log(`Audio provided: ${!!audioBase64 ? 'Yes' : 'No'}, Audio length: ${audioBase64 ? audioBase64.length : 0}`);
    console.log(`Include captions: ${!!includeCaptions ? 'Yes' : 'No'}`);
    
    // Store narration script in the database if provided
    if (narrationScript) {
      console.log(`Narration script provided with length: ${narrationScript.length}`);
      
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
        // Continue execution despite database error
      }
    } else {
      console.log("No narration script provided");
    }

    // Calculate total duration for reference
    const totalDuration = scenes.reduce((sum, scene) => {
      const duration = typeof scene.duration === 'number' ? scene.duration : parseFloat(scene.duration) || 5;
      return sum + duration;
    }, 0);
    
    console.log(`Total video duration: ${totalDuration} seconds`);

    // Create tracks array starting with main video track
    const tracks = [
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
            effect: index % 2 === 0 ? "zoomIn" : "slideUp",
            transition: {
              in: index === 0 ? "fade" : "fade",
              out: index === scenes.length - 1 ? "fade" : "fade"
            },
            fit: "cover"
          };
        })
      }
    ];

    // Add audio track if audio is provided
    let audioUrl = null;
    if (audioBase64 && audioBase64.length > 100) {
      try {
        console.log("Processing audio data for upload");
        const audioFileName = `audio-${projectId}-${Date.now()}.mp3`;
        
        // Some basic validation of the audio data
        if (!audioBase64.match(/^[A-Za-z0-9+/=]+$/)) {
          throw new Error("Invalid base64 data");
        }
        
        // Convert base64 to Uint8Array in chunks to avoid memory issues
        const chunkSize = 1024;
        const chunks = [];
        let offset = 0;
        
        try {
          while (offset < audioBase64.length) {
            const chunk = audioBase64.slice(offset, offset + chunkSize);
            const binaryChunk = atob(chunk);
            const bytes = new Uint8Array(binaryChunk.length);
            
            for (let i = 0; i < binaryChunk.length; i++) {
              bytes[i] = binaryChunk.charCodeAt(i);
            }
            
            chunks.push(bytes);
            offset += chunkSize;
          }
        } catch (base64Error) {
          console.error("Error processing base64 data:", base64Error);
          throw new Error("Failed to decode audio data");
        }
        
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        if (totalLength === 0) {
          throw new Error("Processed audio has zero length");
        }
        
        const audioBytes = new Uint8Array(totalLength);
        let position = 0;
        
        for (const chunk of chunks) {
          audioBytes.set(chunk, position);
          position += chunk.length;
        }
        
        console.log(`Prepared audio data with size: ${audioBytes.length} bytes`);
        
        // Upload audio file to Shotstack assets
        const formData = new FormData();
        formData.append('file', new Blob([audioBytes], { type: 'audio/mpeg' }), audioFileName);
        
        console.log("Uploading audio to Shotstack");
        
        const uploadResponse = await fetch('https://api.shotstack.io/v1/assets/media', {
          method: 'POST',
          headers: {
            'x-api-key': API_KEY
          },
          body: formData
        });
        
        if (!uploadResponse.ok) {
          let errorText = await uploadResponse.text();
          console.error(`Error uploading audio: ${uploadResponse.status}`, errorText);
          throw new Error(`Error uploading audio: ${uploadResponse.status}`);
        }
        
        const uploadResult = await uploadResponse.json();
        console.log("Audio upload result:", JSON.stringify(uploadResult));
        
        if (!uploadResult.success || !uploadResult.response || !uploadResult.response.url) {
          console.error("Invalid response from audio upload:", uploadResult);
          throw new Error("Invalid response from audio upload");
        }
        
        audioUrl = uploadResult.response.url;
        console.log("Audio uploaded successfully, URL:", audioUrl);
        
        // Add audio track to tracks array
        tracks.push({
          clips: [{
            asset: {
              type: "audio",
              src: audioUrl
            },
            start: 0,
            length: totalDuration,
            effect: "fadeOut"
          }]
        });
      } catch (audioError) {
        console.error("Error processing audio:", audioError);
        // Continue without audio rather than failing the entire render
      }
    } else if (audioBase64) {
      console.warn("Audio data was provided but appears invalid or too short:", audioBase64?.length || 0);
    }

    // Add captions track if enabled
    if (includeCaptions && narrationScript && narrationScript.length > 0) {
      try {
        console.log("Adding captions from narration script");
        
        // Clean up narration text and split into sentences
        const cleanScript = narrationScript
          .replace(/\.{2,}/g, '.') // Replace multiple periods with a single one
          .replace(/\s+/g, ' ')    // Replace multiple spaces with a single one
          .trim();
        
        // Split narration into sentences and clean them up
        const sentences = cleanScript
          .split(/[.!?]+/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
        
        console.log(`Generated ${sentences.length} caption segments`);
        
        if (sentences.length === 0) {
          console.warn("No valid sentences found in narration script");
        } else {
          // Calculate approximate duration per caption
          const durationPerCaption = totalDuration / sentences.length;
          
          // Add captions track
          tracks.push({
            clips: sentences.map((text, index) => ({
              asset: {
                type: "title",
                text: text,
                style: "minimal",
                size: "medium",
                position: "bottom",
                background: "#00000080"
              },
              start: index * durationPerCaption,
              length: durationPerCaption
            }))
          });
          
          console.log("Caption track added successfully");
        }
      } catch (captionsError) {
        console.error("Error adding captions:", captionsError);
        // Continue without captions rather than failing the entire render
      }
    } else if (includeCaptions) {
      console.log("Captions enabled but no valid narration script provided");
      
      // Try to use scene descriptions as captions if no narration available
      try {
        console.log("Using scene descriptions as fallback captions");
        
        const captionClips = scenes.map((scene, index) => {
          const startPosition = scenes
            .slice(0, index)
            .reduce((sum, s) => {
              const duration = typeof s.duration === 'number' ? s.duration : parseFloat(s.duration) || 5;
              return sum + duration;
            }, 0);
          
          const duration = typeof scene.duration === 'number' ? scene.duration : parseFloat(scene.duration) || 5;
          
          // Use scene title or description as caption
          const captionText = scene.scene || scene.description || `Scene ${index + 1}`;
          
          return {
            asset: {
              type: "title",
              text: captionText,
              style: "minimal",
              size: "medium",
              position: "bottom",
              background: "#00000080"
            },
            start: startPosition,
            length: duration
          };
        });
        
        tracks.push({ clips: captionClips });
        console.log("Scene-based caption track added as fallback");
      } catch (fallbackCaptionsError) {
        console.error("Error adding fallback captions:", fallbackCaptionsError);
      }
    }

    const timeline = {
      background: "#000000",
      tracks
    };

    const output = {
      format: "mp4",
      resolution: "sd",
      aspectRatio: "16:9"
    };

    const shotstackPayload = { timeline, output };

    console.log("Sending request to Shotstack API");
    console.log("Payload preview:", JSON.stringify({
      trackCount: tracks.length,
      hasCaptions: tracks.length > 1,
      hasAudio: audioUrl !== null,
      videoClipCount: tracks[0].clips.length
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
        let errorText = "";
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = "Could not read error response";
        }
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
            has_captions: !!includeCaptions,
            has_audio: audioUrl !== null
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
      JSON.stringify({ 
        error: "Failed to process video render request", 
        details: error.message 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
