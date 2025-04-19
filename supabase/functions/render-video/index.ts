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
    if (audioBase64) {
      try {
        const audioFileName = `audio-${projectId}-${Date.now()}.mp3`;
        
        // Convert base64 to Uint8Array in chunks
        const chunkSize = 1024;
        const chunks = [];
        let offset = 0;
        
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
        
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
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
        
        const uploadResponse = await fetch('https://api.shotstack.io/v1/assets/media', {
          method: 'POST',
          headers: {
            'x-api-key': API_KEY
          },
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Error uploading audio: ${uploadResponse.status}`);
        }
        
        const uploadResult = await uploadResponse.json();
        console.log("Audio upload result:", JSON.stringify(uploadResult));
        
        if (!uploadResult.success || !uploadResult.response || !uploadResult.response.url) {
          throw new Error("Invalid response from audio upload");
        }
        
        const audioUrl = uploadResult.response.url;
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
      }
    }

    // Add captions track if enabled
    if (includeCaptions && narrationScript) {
      try {
        // Split narration into sentences and clean them up
        const sentences = narrationScript
          .split(/[.!?]+/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
        
        console.log(`Generated ${sentences.length} caption segments`);
        
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
      } catch (captionsError) {
        console.error("Error adding captions:", captionsError);
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
      hasCaptions: tracks.length > 2,
      hasAudio: tracks.some(track => track.clips[0]?.asset?.type === "audio")
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
