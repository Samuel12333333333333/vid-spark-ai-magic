
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
    if (projectId.startsWith("test-project-")) {
      // For testing purposes, create a random UUID instead of using the test string
      const testProjectId = crypto.randomUUID();
      console.log(`Converting test project ID ${projectId} to UUID ${testProjectId} for database compatibility`);
      requestData.projectId = testProjectId;
    }

    console.log(`Rendering video for project ${projectId} with ${scenes.length} scenes`);
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
        .eq("id", projectId);
        
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
    
    // Debug the audio buffer state before processing
    console.log("Audio processing state:", {
      hasAudioFlag: hasAudio,
      audioBase64Present: !!audioBase64,
      audioBase64Length: audioBase64?.length || 0,
      audioDataValid: audioBase64?.length > 100 && !!audioBase64?.match(/^[A-Za-z0-9+/=]+$/)
    });
    
    if (hasAudio && audioBase64 && audioBase64.length > 100 && audioBase64.match(/^[A-Za-z0-9+/=]+$/)) {
      try {
        console.log("Processing audio data for upload");
        const audioFileName = `audio-${projectId}-${Date.now()}.mp3`;
        
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
        
        // Add retry mechanism for audio upload
        let uploadRetries = 0;
        const maxUploadRetries = 2;
        let uploadSuccess = false;
        
        while (uploadRetries <= maxUploadRetries && !uploadSuccess) {
          try {
            const uploadResponse = await fetch('https://api.shotstack.io/v1/assets/media', {
              method: 'POST',
              headers: {
                'x-api-key': API_KEY
              },
              body: formData
            });
            
            if (!uploadResponse.ok) {
              let errorText = await uploadResponse.text();
              console.error(`Audio upload attempt ${uploadRetries + 1} failed: ${uploadResponse.status}`, errorText);
              uploadRetries++;
              if (uploadRetries <= maxUploadRetries) {
                console.log(`Retrying audio upload (${uploadRetries}/${maxUploadRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                continue;
              }
              throw new Error(`Error uploading audio: ${uploadResponse.status}`);
            }
            
            const uploadResult = await uploadResponse.json();
            console.log("Audio upload result:", JSON.stringify(uploadResult));
            
            if (!uploadResult.success || !uploadResult.response || !uploadResult.response.url) {
              console.error("Invalid response from audio upload:", uploadResult);
              uploadRetries++;
              if (uploadRetries <= maxUploadRetries) {
                console.log(`Retrying audio upload (${uploadRetries}/${maxUploadRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                continue;
              }
              throw new Error("Invalid response from audio upload");
            }
            
            audioUrl = uploadResult.response.url;
            uploadSuccess = true;
            console.log("Audio uploaded successfully, URL:", audioUrl);
          } catch (uploadAttemptError) {
            console.error(`Error in audio upload attempt ${uploadRetries + 1}:`, uploadAttemptError);
            uploadRetries++;
            if (uploadRetries <= maxUploadRetries) {
              console.log(`Retrying audio upload (${uploadRetries}/${maxUploadRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
          }
        }
        
        // If we have a valid audio URL after upload attempts
        if (audioUrl) {
          // Add audio track to tracks array
          tracks.push({
            clips: [{
              asset: {
                type: "audio",
                src: audioUrl
              },
              start: 0,
              length: totalDuration,
              // Important: Changed from "fadeOut" to "none" as fadeOut is not supported for video clip effects
              effect: "none"
            }]
          });
          
          // Save the audio URL to the project
          try {
            const { error: updateAudioError } = await supabase
              .from("video_projects")
              .update({
                has_audio: true
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
        } else {
          console.error("Failed to obtain a valid audio URL after all upload attempts");
        }
      } catch (audioError) {
        console.error("Error processing audio:", audioError);
        // Continue without audio rather than failing the entire render
      }
    } else {
      console.log("Skipping audio processing: Invalid or missing audio data");
    }

    // Add captions track if enabled
    if (hasCaptions) {
      try {
        console.log("Adding captions from narration script");
        
        // Ensure we have a script for captions
        if (!scriptToSave || scriptToSave.trim() === '') {
          console.error("No script available for captions");
          scriptToSave = "Experience this visual journey with us.";
        }
        
        // Clean up narration text and split into sentences
        const cleanScript = scriptToSave
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
          console.warn("No valid sentences found in narration script, using default caption");
          // Add a single caption with default text
          tracks.push({
            clips: [{
              asset: {
                type: "title",
                text: "Experience this visual journey with us",
                style: "minimal",
                size: "medium",
                position: "bottom",
                background: "#00000080"
              },
              start: 0,
              length: totalDuration
            }]
          });
        } else {
          // Calculate approximate duration per caption
          const durationPerCaption = totalDuration / sentences.length;
          
          // Add captions track with multiple segments
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
        }
        
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
      } catch (captionsError) {
        console.error("Error adding captions:", captionsError);
        // Continue without captions rather than failing the entire render
      }
    } else {
      console.log("Skipping captions: Captions are disabled");
    }

    // Add a soundtrack if no audio was provided
    if (!audioUrl) {
      console.log("No audio provided, adding a background soundtrack");
      
      // Choose a default soundtrack
      const soundtrack = {
        src: "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/music/unminus/palmtrees.mp3",
        // Changed from "fadeOut" to "none" since fadeOut is not a valid video effect
        effect: "none"
      };
      
      tracks.push({
        clips: [{
          asset: {
            type: "audio",
            src: soundtrack.src
          },
          start: 0,
          length: totalDuration,
          effect: soundtrack.effect
        }]
      });
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
      // Add retry mechanism for Shotstack API calls
      let shotStackRetries = 0;
      const maxShotStackRetries = 2;
      let shotStackData = null;
      let shotStackError = null;
      
      while (shotStackRetries <= maxShotStackRetries && !shotStackData) {
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
            console.error(`Shotstack API error response (attempt ${shotStackRetries + 1}):`, errorText);
            shotStackRetries++;
            if (shotStackRetries <= maxShotStackRetries) {
              console.log(`Retrying Shotstack API call (${shotStackRetries}/${maxShotStackRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
              continue;
            }
            throw new Error(`Shotstack API error: ${response.status} ${response.statusText}`);
          }
    
          const data = await response.json();
          console.log("Shotstack API response:", JSON.stringify(data));
          
          if (!data.response || !data.response.id) {
            console.error(`Invalid response from Shotstack API (attempt ${shotStackRetries + 1}):`, data);
            shotStackRetries++;
            if (shotStackRetries <= maxShotStackRetries) {
              console.log(`Retrying Shotstack API call (${shotStackRetries}/${maxShotStackRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
              continue;
            }
            throw new Error("Invalid response from Shotstack API");
          }
          
          shotStackData = data;
          console.log("Shotstack render ID:", data.response.id);
          break;
        } catch (apiAttemptError) {
          console.error(`Error in Shotstack API call attempt ${shotStackRetries + 1}:`, apiAttemptError);
          shotStackError = apiAttemptError;
          shotStackRetries++;
          if (shotStackRetries <= maxShotStackRetries) {
            console.log(`Retrying Shotstack API call (${shotStackRetries}/${maxShotStackRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
      }
      
      // If we couldn't get a successful response after all retries, throw the last error
      if (!shotStackData) {
        throw shotStackError || new Error('Failed to get a valid response from Shotstack API after multiple attempts');
      }
      
      const renderId = shotStackData.response.id;

      // Update the project in Supabase with the render ID and metadata
      try {
        const { error: updateError } = await supabase
          .from("video_projects")
          .update({
            render_id: renderId,
            status: "processing",
            has_captions: hasCaptions,
            has_audio: !!audioUrl
          })
          .eq("id", projectId);
          
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
          hasAudio: !!audioUrl,
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
          .eq("id", projectId);
          
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
