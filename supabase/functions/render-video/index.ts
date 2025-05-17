
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced error logging function
function logError(title: string, error: any, context: Record<string, any> = {}) {
  console.error(`====== ERROR: ${title} ======`);
  console.error(error?.message || error);
  
  if (Object.keys(context).length > 0) {
    console.error("Context:", JSON.stringify(context, null, 2));
  }
  
  if (error?.stack) {
    console.error("Stack:", error.stack);
  }
  
  console.error("==============================");
}

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
      logError("Missing API Key", "SHOTSTACK_API_KEY is not set");
      throw new Error("Shotstack API key is not configured");
    }

    // Create Supabase client to update project status
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logError("Missing Supabase Config", "Supabase environment variables are not set");
      throw new Error("Supabase configuration is missing");
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    let params;
    try {
      params = await req.json();
      console.log("Received render request with params:", JSON.stringify({
        projectId: params.projectId,
        userId: params.userId,
        prompt: params.prompt?.substring(0, 50) + (params.prompt?.length > 50 ? '...' : ''),
        style: params.style,
        sceneCount: params.scenes?.length || 0,
        hasAudio: params.has_audio,
        hasCaptions: params.has_captions
      }, null, 2));
    } catch (parseError) {
      logError("Request Parsing Error", parseError);
      throw new Error("Invalid request body: " + parseError.message);
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
      brandKit,
      mediaUrls = [],
      useStockMedia = true
    } = params;
    
    // Validate required parameters
    if (!projectId) {
      throw new Error("Project ID is required");
    }
    
    // Check if scenes are provided, if not, we can't create the video
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      logError("No Scenes Error", "No valid scenes provided, cannot create video", { projectId });
      throw new Error("No valid scenes provided for video creation");
    }
    
    console.log(`Creating video for project ${projectId} with ${scenes.length} scenes`);
    
    // Create Shotstack timeline
    const timeline = {
      background: "#000000",
      tracks: []
    };

    // IMPORTANT: We need to fetch videos from Pexels if no videoUrls are provided
    // Let's query Pexels API with keywords from each scene
    async function fetchStockVideo(keywords) {
      try {
        const pexelsApiKey = Deno.env.get("PEXELS_API_KEY");
        if (!pexelsApiKey) {
          throw new Error("Pexels API key not configured");
        }

        const searchTerm = Array.isArray(keywords) ? keywords.slice(0, 3).join(" ") : keywords;
        console.log(`Searching Pexels videos for: ${searchTerm}`);
        
        const response = await fetch(
          `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchTerm)}&per_page=1&orientation=landscape`,
          {
            headers: {
              "Authorization": pexelsApiKey
            }
          }
        );

        if (!response.ok) {
          const responseText = await response.text();
          logError("Pexels API Error", `${response.status} ${response.statusText}`, {
            searchTerm,
            responseText
          });
          throw new Error(`Pexels API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.videos && data.videos.length > 0) {
          // Find the HD or SD video file
          const videoFiles = data.videos[0].video_files;
          const hdVideo = videoFiles.find(file => file.quality === "hd" && file.width >= 1280);
          const sdVideo = videoFiles.find(file => file.quality === "sd");
          const anyVideo = videoFiles[0]; // Fallback to any video
          
          const videoFile = hdVideo || sdVideo || anyVideo;
          console.log(`Found video: ${videoFile.link}`);
          return videoFile.link;
        }
        
        throw new Error("No videos found for keywords");
      } catch (error) {
        logError("Stock Video Fetch Error", error, { keywords });
        return null;
      }
    }
    
    // Add scenes to timeline
    const videoClipTrack = { clips: [] };
    const captionTrack = has_captions ? { clips: [] } : null;
    
    // Process scenes - we'll first check for provided videoUrl properties
    // If not available, we'll search for stock videos based on keywords
    let currentTime = 0;
    const scenesWithVideos = [...scenes]; // Clone array to avoid mutating original
    
    // First, check if we have any valid video URLs
    const hasAnyVideoUrls = scenes.some(scene => 
      scene.videoUrl || scene.media_url || scene.url || (scene.media && scene.media.url)
    );
    
    // If no scenes have videoUrls, fetch videos for each scene if useStockMedia is true
    if (!hasAnyVideoUrls && mediaUrls.length === 0 && useStockMedia) {
      console.log("No video URLs found in scenes, searching for stock videos");
      
      // We need to fetch videos for each scene
      for (let i = 0; i < scenesWithVideos.length; i++) {
        const scene = scenesWithVideos[i];
        const keywords = scene.keywords || [scene.scene, "video"];
        
        try {
          const videoUrl = await fetchStockVideo(keywords);
          if (videoUrl) {
            scenesWithVideos[i] = { ...scene, videoUrl };
            console.log(`Added video URL to scene ${i}: ${videoUrl}`);
          } else {
            // Log and add a placeholder for the missing video
            logError("Missing Video", "Failed to get video for scene", { 
              sceneIndex: i,
              sceneTitle: scene.scene || "Unnamed Scene",
              keywords
            });
          }
        } catch (fetchErr) {
          logError("Video Fetch Error", fetchErr, {
            sceneIndex: i,
            sceneTitle: scene.scene || "Unnamed Scene",
            keywords
          });
        }
      }
    } else if (mediaUrls && mediaUrls.length > 0) {
      // Use provided mediaUrls if available
      console.log(`Using ${mediaUrls.length} provided media URLs`);
      
      for (let i = 0; i < Math.min(scenesWithVideos.length, mediaUrls.length); i++) {
        scenesWithVideos[i] = { ...scenesWithVideos[i], videoUrl: mediaUrls[i] };
        console.log(`Added media URL to scene ${i}: ${mediaUrls[i]}`);
      }
    }
    
    // Check if we have valid video URLs after all processing
    const validScenesWithVideos = scenesWithVideos.filter(scene => {
      const hasValidUrl = Boolean(
        scene.videoUrl || 
        scene.media_url || 
        scene.url || 
        (scene.media && scene.media.url)
      );
      
      if (!hasValidUrl) {
        logError("Missing Video URL", `Scene missing video URL: ${scene.scene || 'Unnamed scene'}`, {
          sceneData: JSON.stringify(scene)
        });
      }
      
      return hasValidUrl;
    });
    
    if (validScenesWithVideos.length === 0) {
      console.error("No valid video URLs found in scenes after processing");
      throw new Error("No valid video URLs found in scenes. Please ensure each scene has a videoUrl property or enable stock videos.");
    }
    
    console.log(`Found ${validScenesWithVideos.length} valid scenes with videos`);
    
    // Create video clips for valid scenes
    const defaultDuration = 5; // Default duration per scene in seconds
    
    validScenesWithVideos.forEach((scene, index) => {
      try {
        // Extract video URL from various possible properties
        const videoUrl = scene.videoUrl || scene.media_url || scene.url || 
                      (scene.media && scene.media.url);
        
        if (!videoUrl) {
          console.log(`Skipping scene ${index} - no video URL found`);
          return; // Skip scenes without video URLs
        }
        
        console.log(`Adding scene ${index} with video: ${videoUrl}`);
        
        // Use provided duration or fallback to default
        const duration = scene.duration || defaultDuration;
        
        // Add video clip
        videoClipTrack.clips.push({
          asset: {
            type: "video",
            src: videoUrl,
            trim: 0,
          },
          start: currentTime,
          length: duration,
          effect: "zoomIn",
          transition: {
            // Only add transition properties if they're non-null strings
            ...(index === 0 ? { in: "fade" } : { in: "slideLeft" }),
            ...(index === (validScenesWithVideos.length - 1) ? { out: "fade" } : {})
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
            length: duration
          });
        }
        
        currentTime += duration;
      } catch (sceneError) {
        logError("Scene Processing Error", sceneError, {
          sceneIndex: index,
          sceneTitle: scene.scene || "Unnamed Scene" 
        });
      }
    });
    
    // Check if we have any valid clips
    if (!videoClipTrack.clips || videoClipTrack.clips.length === 0) {
      logError("No Valid Clips", "No valid video clips could be created");
      throw new Error("Failed to create video clips from the provided scenes.");
    }
    
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
      output
    };
    
    console.log("Sending render request to Shotstack API");
    
    // Validate the renderRequest
    if (!renderRequest.timeline || !renderRequest.timeline.tracks || renderRequest.timeline.tracks.length === 0) {
      logError("Invalid Request", "Invalid render request: Missing tracks", {
        renderRequest: JSON.stringify(renderRequest)
      });
      throw new Error("Invalid render request: Missing tracks");
    }
    
    if (!renderRequest.timeline.tracks[0].clips || renderRequest.timeline.tracks[0].clips.length === 0) {
      logError("Invalid Request", "Invalid render request: No clips in track", {
        renderRequest: JSON.stringify(renderRequest)
      });
      throw new Error("Invalid render request: No clips in track");
    }
    
    // Call Shotstack API to render video
    const response = await fetch("https://api.shotstack.io/v1/render", {
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
      logError("Shotstack API Error", `${response.status} ${response.statusText}`, {
        errorResponse: errorText,
        renderRequestSize: JSON.stringify(renderRequest).length,
        firstClipUrl: renderRequest.timeline.tracks[0].clips[0]?.asset?.src || "No URL"
      });
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Shotstack render response:", JSON.stringify(data));
    
    // Get render ID from response
    const renderId = data.response?.id;
    if (!renderId) {
      logError("Missing Render ID", "No render ID returned from Shotstack", {
        response: JSON.stringify(data)
      });
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
        logError("Database Update Error", updateError, { projectId });
      }
    } catch (dbError) {
      logError("Database Error", dbError, { projectId });
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
    logError("Render Function Error", error);
    
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
          
          console.log(`Updated project ${projectId} status to failed due to error`);
        }
      }
    } catch (updateError) {
      logError("Error updating project status", updateError);
    }
    
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred during video rendering",
        timestamp: new Date().toISOString(),
        details: error.stack ? error.stack.split("\n").slice(0, 3).join("\n") : null
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
