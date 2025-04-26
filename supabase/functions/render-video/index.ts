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
      has_captions: hasCaptionsFlag,
      audioUrl,
      captionsFile
    } = requestData;
    
    // Use explicit flags from request or fall back to derived values
    const hasAudio = hasAudioFlag === true || (!!audioBase64 && audioBase64.length > 100) || !!audioUrl;
    const hasCaptions = hasCaptionsFlag === true || includeCaptions === true || !!captionsFile;
    
    // Log audio and caption information
    console.log(`Audio status: hasAudio=${hasAudio}, audioUrl=${audioUrl || "none"}`);
    console.log(`Captions status: hasCaptions=${hasCaptions}, captionsFile=${captionsFile || "none"}`);
    
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
      if (hasAudio) {
        console.log("Adding audio to timeline");
        
        let audioAssetUrl = audioUrl;
        
        // If we have base64 audio but no URL, we'd need to upload it first
        // This would typically be handled by another function
        if (!audioAssetUrl && audioBase64 && audioBase64.length > 100) {
          console.log("Audio provided as base64 but no URL is available - audio may not be included");
          // Would need an additional step to convert base64 to URL
        }
        
        if (audioAssetUrl) {
          console.log(`Using audio URL: ${audioAssetUrl}`);
          
          // Add soundtrack to the timeline
          timeline.soundtrack = {
            src: audioAssetUrl,
            effect: "fadeOut"
          };
        }
      }

      // Add text overlays for captions if enabled
      let captionClips = [];
      if (hasCaptions && captionsFile) {
        console.log(`Adding captions from file: ${captionsFile}`);
        
        // Add a dedicated track for captions
        timeline.tracks.push({
          clips: [
            {
              asset: {
                type: "html",
                html: `<div id="captions"></div>`,
                css: `
                  #captions {
                    position: absolute;
                    bottom: 80px;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 24px;
                    color: white;
                    text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.5);
                    background: rgba(0, 0, 0, 0.5);
                    padding: 10px;
                  }
                `,
                width: 1280,
                height: 720
              },
              start: 0,
              length: totalDuration,
              effect: "zoomIn"
            }
          ]
        });
        
        // Add the VTT file directly as a subtitle asset
        timeline.subtitles = {
          src: captionsFile,
          type: "vtt"
        };
      } else if (hasCaptions && narrationScript) {
        console.log("Captions enabled but no caption file provided. Using simple text overlay.");
        
        // Split narration into segments
        const segments = narrationScript.split(/[.!?]/).filter(s => s.trim() !== "");
        const segmentDuration = totalDuration / Math.max(segments.length, 1);
        
        // Add text overlays for each segment
        captionClips = segments.map((segment, index) => {
          return {
            asset: {
              type: "title",
              text: segment.trim(),
              style: "minimal",
              size: "medium",
              color: "#ffffff",
              background: "#00000099"
            },
            start: index * segmentDuration,
            length: segmentDuration,
            position: "bottom"
          };
        });
      }

      const output = {
        format: "mp4",
        resolution: "sd",
        aspectRatio: "16:9"
      };

      const shotstackPayload = { 
        timeline, 
        output,
        callback: requestData.callbackUrl // Optional callback URL if provided
      };

      // Remove the subtitles property entirely
      delete shotstackPayload.timeline.subtitles;

      console.log("Sending request to Shotstack API with payload:", JSON.stringify(shotstackPayload));
      
      // First check credits by making a GET request to the account endpoint
      try {
        const accountResponse = await fetch("https://api.shotstack.io/v1/me", {
          method: "GET",
          headers: {
            "x-api-key": API_KEY
          }
        });
        
        if (!accountResponse.ok) {
          console.error(`Shotstack account API error: ${accountResponse.status} ${accountResponse.statusText}`);
        } else {
          const accountData = await accountResponse.json();
          console.log("Account data:", JSON.stringify(accountData));
          
          if (accountData.response && accountData.response.credits !== undefined) {
            const availableCredits = accountData.response.credits;
            console.log(`Available credits: ${availableCredits}`);
            
            // Estimate credit requirement (based on duration and complexity)
            // This is a simplified estimation - Shotstack's actual calculation may vary
            const estimatedCredits = (totalDuration / 60) * 0.1; // Rough estimate
            console.log(`Estimated credits required: ${estimatedCredits}`);
            
            if (availableCredits < estimatedCredits) {
              console.log(`Insufficient credits: ${availableCredits} available, ${estimatedCredits} estimated required`);
              
              // Update project status to failed due to insufficient credits
              try {
                const { error: updateError } = await supabase
                  .from("video_projects")
                  .update({
                    status: "failed",
                    error_message: "Insufficient Shotstack credits to render this video. Please contact support."
                  })
                  .eq("id", actualProjectId);
                  
                if (updateError) {
                  console.error("Error updating project status:", updateError);
                } else {
                  console.log("Updated project status to failed due to insufficient credits");
                }
              } catch (statusError) {
                console.error("Error updating project status:", statusError);
              }
              
              return new Response(
                JSON.stringify({ 
                  error: "Insufficient Shotstack credits",
                  details: "Your account doesn't have enough credits to render this video. Please upgrade your Shotstack plan.",
                  creditsAvailable: availableCredits,
                  creditsNeeded: estimatedCredits 
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 }
              );
            }
          }
        }
      } catch (creditCheckError) {
        console.error("Error checking Shotstack credits:", creditCheckError);
        // Continue with the render attempt even if credit check fails
      }
      
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
          console.error(`Shotstack API error response:`, errorText);
        } catch (e) {
          errorText = "Could not read error response";
          console.error("Could not read Shotstack error response");
        }
        
        // Check specifically for credit limit errors
        const isCreditLimitError = 
          response.status === 403 && 
          (errorText.includes("credits required") || 
           errorText.includes("exceeds one or more plan limits"));
        
        if (isCreditLimitError) {
          console.error("Shotstack credit limit reached:", errorText);
          
          // Extract the credit information from the error message if possible
          let creditsRequired = "unknown";
          let creditsAvailable = "0.00";
          
          try {
            // Try to parse credit information from error message
            const creditsRequiredMatch = errorText.match(/'([0-9.]+)' credits required/);
            const creditsAvailableMatch = errorText.match(/you have '([0-9.]+)' credits left/);
            
            if (creditsRequiredMatch && creditsRequiredMatch[1]) {
              creditsRequired = creditsRequiredMatch[1];
            }
            
            if (creditsAvailableMatch && creditsAvailableMatch[1]) {
              creditsAvailable = creditsAvailableMatch[1];
            }
          } catch (parseError) {
            console.error("Error parsing credit information from error message:", parseError);
          }
          
          // Update project with credit limit error
          try {
            const { error: updateError } = await supabase
              .from("video_projects")
              .update({
                status: "failed",
                error_message: `Insufficient Shotstack credits (${creditsRequired} required, ${creditsAvailable} available). Please contact support.`
              })
              .eq("id", actualProjectId);
              
            if (updateError) {
              console.error("Error updating project with credit limit error:", updateError);
            } else {
              console.log("Updated project with credit limit error");
            }
          } catch (dbError) {
            console.error("Database error when updating credit limit error:", dbError);
          }
          
          return new Response(
            JSON.stringify({ 
              error: "Insufficient Shotstack credits",
              details: `Your account doesn't have enough credits to render this video. ${creditsRequired} credits required, ${creditsAvailable} available. Please upgrade your Shotstack plan.`,
              creditsRequired,
              creditsAvailable,
              upgradeUrl: "https://dashboard.shotstack.io/subscription"
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 }
          );
        }
        
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
            has_audio: hasAudio,
            error_message: null // Clear any previous error messages
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
            status: "failed",
            error_message: apiError.message || "Error calling Shotstack API"
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
    
    // Ensure we update the project status with a clear error message
    try {
      await supabase
        .from("video_projects")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unexpected error during video rendering"
        })
        .eq("id", actualProjectId);
    } catch (dbError) {
      console.error("Error updating project status:", dbError);
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unexpected error"
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
