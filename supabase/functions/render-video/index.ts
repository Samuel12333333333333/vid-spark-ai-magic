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
        hasCaptions: params.has_captions,
        templateProvided: Boolean(params.template)
      }, null, 2));
    } catch (parseError) {
      logError("Request Parsing Error", parseError);
      throw new Error("Invalid request body: " + parseError.message);
    }
    
    const { 
      projectId, 
      userId,
      prompt,
      scenes,
      style,
      audioUrl, 
      has_audio,
      has_captions,
      captionsFile,
      brandKit,
      mediaUrls = [],
      useStockMedia = true,
      template = null
    } = params;
    
    // Check for required parameters
    if (!projectId) {
      throw new Error("Project ID is required");
    }
    
    if (!userId) {
      logError("Missing User ID", "User ID is required", { projectId });
      throw new Error("User ID is required");
    }
    
    console.log(`Creating video for project ${projectId} for user ${userId}`);
    
    // Determine if we're using a prebuilt template or creating a timeline from scenes
    let renderRequest;
    
    if (template) {
      // Use the provided template directly
      console.log("Using provided template for rendering");
      renderRequest = template;
      
      // Log template structure for debugging
      try {
        console.log("Template includes:");
        console.log(`- Timeline: ${Boolean(renderRequest.timeline)}`);
        console.log(`- Output: ${Boolean(renderRequest.output)}`);
        console.log(`- Merge fields: ${renderRequest.merge ? renderRequest.merge.length : 0}`);
      } catch (err) {
        logError("Template Logging Error", err);
      }
    } else {
      // Check if scenes are provided for creating a custom timeline
      if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
        logError("No Scenes Error", "No valid scenes provided, cannot create video", { projectId });
        throw new Error("No valid scenes provided for video creation");
      }
      
      // Create Shotstack timeline from scenes
      renderRequest = await createTimelineFromScenes(scenes, audioUrl, has_captions, mediaUrls, useStockMedia);
    }
    
    // Validate the renderRequest
    if (!renderRequest) {
      logError("Invalid Request", "Invalid render request: renderRequest is null", {
        template: Boolean(template),
        scenes: Boolean(scenes)
      });
      throw new Error("Failed to create render request");
    }
    
    if (template && !validateTemplate(renderRequest)) {
      logError("Invalid Template", "Template is missing required properties", {
        hasTimeline: Boolean(renderRequest.timeline),
        hasOutput: Boolean(renderRequest.output)
      });
      throw new Error("Invalid template structure - missing required properties");
    } else if (!template && (!renderRequest.timeline || !renderRequest.timeline.tracks || renderRequest.timeline.tracks.length === 0)) {
      logError("Invalid Request", "Invalid render request: Missing tracks", {
        renderRequest: JSON.stringify(renderRequest)
      });
      throw new Error("Invalid render request: Missing tracks");
    }
    
    // Call Shotstack API to render video
    console.log("Sending render request to Shotstack API");
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
        renderRequestSize: JSON.stringify(renderRequest).length
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
    
    // Start polling for render status immediately to get URL faster
    try {
      pollRenderStatus(renderId, projectId, shotstackApiKey, supabaseClient);
    } catch (pollError) {
      logError("Poll Setup Error", pollError, { renderId, projectId });
      // Continue despite error, polling can be retried separately
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

// Function to validate template structure
function validateTemplate(template) {
  if (!template) return false;
  if (!template.timeline) return false;
  if (!template.output) return false;
  
  // Minimum check - more detailed validation could be added
  return true;
}

// Function to create a timeline from scenes
async function createTimelineFromScenes(scenes, audioUrl, hasCaptions, mediaUrls, useStockMedia) {
  
  console.log(`Creating video for project with ${scenes.length} scenes`);
    
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
    const captionTrack = hasCaptions ? { clips: [] } : null;
    
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
        if (hasCaptions && captionTrack) {
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
    if (audioUrl) {
      console.log("Adding audio to timeline:", audioUrl);
      timeline.soundtrack = {
        src: audioUrl,
        effect: "fadeOut"
      };
    }
  
  // Create output configuration
  const output = {
    format: "mp4",
    resolution: "sd" // Standard definition (480p)
  };
  
  return {
    timeline,
    output
  };
}

// Function to poll for render status and update the project when complete
async function pollRenderStatus(renderId, projectId, shotstackApiKey, supabaseClient) {
  console.log(`Starting background polling for project ${projectId} with render ID ${renderId}`);
  
  // Edge Functions only run for a limited time (10-60 seconds typically)
  // So we can only do initial polling here, client needs to continue polling
  
  const maxAttempts = 5; // Only try a few times in the edge function
  const interval = 3000; // 3 seconds between checks
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Wait between attempts
      await new Promise(resolve => setTimeout(resolve, interval));
      
      // Check status
      const response = await fetch(`https://api.shotstack.io/v1/render/${renderId}`, {
        method: "GET",
        headers: {
          "x-api-key": shotstackApiKey,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        console.error(`Error checking status: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      const status = data.response?.status;
      const url = data.response?.url;
      
      console.log(`Poll attempt ${attempt+1}: status=${status}, url=${url || 'none'}`);
      
      // If rendering is complete, update the project
      if (status === "done" && url) {
        console.log(`Render completed early! Updating project with URL: ${url}`);
        
        await supabaseClient
          .from("video_projects")
          .update({
            status: "completed",
            video_url: url,
            thumbnail_url: data.response?.thumbnail || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", projectId);
          
        console.log("Project updated with video URL!");
        break;
      }
      
      // If failed, update project
      if (status === "failed") {
        console.log("Render failed in early polling!");
        
        await supabaseClient
          .from("video_projects")
          .update({
            status: "failed",
            error_message: data.response?.error || "Rendering failed",
            updated_at: new Date().toISOString()
          })
          .eq("id", projectId);
          
        break;
      }
    } catch (error) {
      console.error("Error in polling:", error);
    }
  }
  
  console.log("Background polling complete - client must continue polling");
}
