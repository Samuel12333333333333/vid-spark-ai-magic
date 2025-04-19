
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
      audioProvided: !!requestData.audioBase64 ? "Yes" : "No",
      audioLength: requestData.audioBase64?.length || 0,
      captionsEnabled: !!requestData.includeCaptions
    }));
    
    const { scenes, userId, projectId, audioBase64, includeCaptions, narrationScript } = requestData;
    
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
    
    // Log audio and captions status
    const hasAudio = !!audioBase64 && audioBase64.length > 100;
    console.log(`Audio provided: ${hasAudio ? 'Yes' : 'No'}, Audio length: ${audioBase64 ? audioBase64.length : 0}`);
    console.log(`Include captions: ${includeCaptions ? 'Yes' : 'No'}`);
    
    // Store narration script in the database if provided
    let scriptToSave = narrationScript;
    if (scriptToSave && typeof scriptToSave === 'string' && scriptToSave.trim() !== '') {
      console.log(`Narration script provided with length: ${scriptToSave.length}`);
      
      try {
        // Update the project with the narration script
        const { error: updateNarrationError } = await supabase
          .from("video_projects")
          .update({
            narration_script: scriptToSave,
            has_audio: hasAudio,
            has_captions: includeCaptions
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
      console.log("No valid narration script provided");
      // Try to get narration script from scene descriptions as fallback
      try {
        scriptToSave = scenes
          .map(scene => scene.description || scene.scene || "")
          .filter(text => text.trim() !== "")
          .join(". ");
        
        if (scriptToSave) {
          console.log(`Generated fallback narration from scenes: ${scriptToSave.substring(0, 100)}...`);
          
          // Update with the fallback script
          const { error: updateFallbackError } = await supabase
            .from("video_projects")
            .update({
              narration_script: scriptToSave,
              has_audio: hasAudio,
              has_captions: includeCaptions
            })
            .eq("id", projectId);
            
          if (updateFallbackError) {
            console.error("Error updating fallback narration:", updateFallbackError);
          }
        }
      } catch (fallbackError) {
        console.error("Error generating fallback narration:", fallbackError);
      }
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
    if (hasAudio) {
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
        if (audioUrl) {
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
          
          // Save the audio URL to the project
          try {
            const { error: updateAudioError } = await supabase
              .from("video_projects")
              .update({
                has_audio: true,
                // Store the audio URL in narration_script if we don't have a script yet
                ...((!scriptToSave || scriptToSave.trim() === '') ? { narration_script: `Audio URL: ${audioUrl}` } : {})
              })
              .eq("id", projectId);
              
            if (updateAudioError) {
              console.error("Error updating project with audio URL:", updateAudioError);
            } else {
              console.log("Successfully updated project with audio information");
            }
          } catch (audioUpdateError) {
            console.error("Error saving audio URL to project:", audioUpdateError);
          }
        }
      } catch (audioError) {
        console.error("Error processing audio:", audioError);
        // Continue without audio rather than failing the entire render
      }
    }

    // Add captions track if enabled
    if (includeCaptions) {
      try {
        console.log("Adding captions from narration script");
        
        // Use provided narration script or fall back to scene descriptions
        let captionText = scriptToSave;
        if (!captionText || captionText.trim() === '') {
          captionText = scenes
            .map(scene => scene.description || scene.scene || `Scene ${scenes.indexOf(scene) + 1}`)
            .join(". ");
          console.log("Using scene descriptions for captions:", captionText.substring(0, 100) + "...");
        }
        
        // Clean up narration text and split into sentences
        const cleanScript = captionText
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
          
          // Update project to indicate captions are included
          try {
            const { error: updateCaptionsError } = await supabase
              .from("video_projects")
              .update({
                has_captions: true
              })
              .eq("id", projectId);
              
            if (updateCaptionsError) {
              console.error("Error updating project with captions flag:", updateCaptionsError);
            } else {
              console.log("Successfully updated project with captions information");
            }
          } catch (captionsUpdateError) {
            console.error("Error saving captions flag to project:", captionsUpdateError);
          }
          
          console.log("Caption track added successfully");
        }
      } catch (captionsError) {
        console.error("Error adding captions:", captionsError);
        // Continue without captions rather than failing the entire render
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
      hasCaptions: tracks.length > (audioUrl ? 2 : 1),
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
            has_captions: includeCaptions === true,
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
