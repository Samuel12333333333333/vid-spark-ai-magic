
import { supabase } from "@/integrations/supabase/client";
import { RenderResponse, RenderStatus } from "./types";
import { toast } from "sonner";
import { showErrorToast, withRetry } from "@/lib/error-handler";
import { renderStatusService } from "./renderStatusService";
import { VideoRenderOptions, RenderRequestBody } from "@/types/custom-types";

export const videoRenderService = {
  async startRender(
    projectId: string,
    prompt: string,
    style: string,
    scenes: any[] = [],
    hasAudio: boolean = false,
    hasCaptions: boolean = false,
    audioUrl?: string,
    captionsUrl?: string,
    template?: any // Add support for direct template rendering
  ): Promise<{ renderId?: string; success: boolean; error?: string }> {
    try {
      console.log(`Starting render for project ${projectId}`);
      console.log(`Audio settings: hasAudio=${hasAudio}, audioUrl=${audioUrl || 'none'}`);
      console.log(`Caption settings: hasCaptions=${hasCaptions}, captionsUrl=${captionsUrl || 'none'}`);
      
      // If a template is provided, we'll use that directly instead of scenes
      if (template) {
        console.log("Using provided template for rendering");
        
        // If audio is requested but not in template, try to generate it
        if (hasAudio && !audioUrl && !template.timeline?.soundtrack) {
          try {
            const narrationScript = template.merge?.find(item => item.find === "VOICEOVER")?.replace;
            if (narrationScript) {
              console.log("Template has narration script, generating audio");
              audioUrl = await this.generateAudioForTemplate(narrationScript, projectId);
              
              if (audioUrl) {
                // Add soundtrack to template if audio was generated
                if (!template.timeline.soundtrack) {
                  template.timeline.soundtrack = {
                    src: audioUrl,
                    effect: "fadeOut"
                  };
                  console.log("Added soundtrack to template");
                }
              }
            }
          } catch (audioErr) {
            console.error("Error generating audio for template:", audioErr);
            // Continue without audio if generation fails
          }
        }
        
        // If captions are requested but not in template
        if (hasCaptions && !captionsUrl && !template.timeline?.subtitles) {
          try {
            const narrationScript = template.merge?.find(item => item.find === "VOICEOVER")?.replace;
            if (narrationScript) {
              console.log("Template has narration script, adding captions");
              // Add captions directly to template
              
              // Check if we already have a caption track
              const hasCaptionTrack = template.timeline.tracks.some(track => 
                track.clips?.some(clip => clip.asset?.type === "caption")
              );
              
              if (!hasCaptionTrack) {
                // Add a track for captions if not already present
                template.timeline.tracks.push({
                  clips: [
                    {
                      asset: {
                        type: "caption",
                        text: narrationScript,
                        style: "minimal",
                        background: {
                          color: "#00000080",
                          padding: 10,
                          borderRadius: 5
                        },
                        font: {
                          size: "30"
                        }
                      },
                      start: 0,
                      length: "end",
                      position: "bottom"
                    }
                  ]
                });
                console.log("Added captions track to template");
              }
            }
          } catch (captionErr) {
            console.error("Error adding captions to template:", captionErr);
            // Continue without captions if adding fails
          }
        }
      } else if (!scenes || scenes.length === 0) {
        console.error("No scenes or template provided for rendering");
        showErrorToast("No scenes or template provided for video rendering");
        return { success: false, error: "No scenes or template provided for video rendering" };
      } else {
        console.log(`Using ${scenes.length} scenes for rendering`);
        
        // Make sure each scene has necessary properties including videoUrl
        const validatedScenes = scenes.map(scene => {
          // Check if videoUrl is missing
          if (!scene.videoUrl) {
            console.warn(`Scene "${scene.scene || 'Unnamed Scene'}" is missing videoUrl property`);
          }
          
          // Ensure each scene has at least these properties
          return {
            scene: scene.scene || scene.title || "Unnamed Scene",
            description: scene.description || "",
            keywords: scene.keywords || [],
            duration: scene.duration || 5,
            videoUrl: scene.videoUrl || scene.media_url || null // Try alternate field names
          };
        });
        
        // Log what we're sending for debugging
        console.log(`Validated ${validatedScenes.length} scenes`);
        
        // Add audio generation if requested but not provided
        if (hasAudio && !audioUrl) {
          try {
            // Generate a narrative script from the scenes
            const narrationScript = this.generateNarrationFromScenes(scenes);
            if (narrationScript) {
              audioUrl = await this.generateAudioForTemplate(narrationScript, projectId);
              console.log("Generated audio for scenes:", audioUrl ? "success" : "failed");
            }
          } catch (audioErr) {
            console.error("Error generating audio for scenes:", audioErr);
            // Continue without audio
          }
        }
      }
      
      // Test the Shotstack API connection
      try {
        console.log("Testing Shotstack API connection before rendering");
        // Use a more direct check to validate the Shotstack API key
        const shotstackApiKey = await this.validateShotstackApiKey();
        
        if (!shotstackApiKey) {
          console.error("Shotstack API key validation failed");
          showErrorToast("Failed to validate Shotstack API key. Please check your API key in project settings.");
          return { success: false, error: "Shotstack API key validation failed" };
        }
      } catch (testErr) {
        console.error("Exception testing Shotstack API:", testErr);
        showErrorToast("Error validating Shotstack API: " + (testErr instanceof Error ? testErr.message : String(testErr)));
        return { success: false, error: "Error validating Shotstack API" };
      }

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser()
        .catch(error => {
          console.error("Error getting user:", error);
          showErrorToast("Authentication error: Failed to get user");
          throw new Error("Authentication error: Failed to get user");
        });

      const userId = user?.id;

      if (!userId) {
        console.error("No authenticated user found");
        showErrorToast("Authentication error: No user found");
        return { success: false, error: "Authentication error: No user found" };
      }
      
      // Build request body based on whether template or scenes are provided
      const requestBody: RenderRequestBody = template 
        ? { 
            projectId, 
            userId, 
            prompt, 
            style, 
            template, 
            has_audio: hasAudio, 
            has_captions: hasCaptions, 
            audioUrl, 
            captionsUrl 
          } 
        : { 
            projectId, 
            userId, 
            prompt, 
            style, 
            scenes, 
            useStockMedia: true, 
            has_audio: hasAudio, 
            has_captions: hasCaptions, 
            audioUrl, 
            captionsUrl 
          };
      
      console.log("Sending render-video request with audio/caption settings:", 
        { hasAudio, hasCaptions, hasAudioUrl: !!audioUrl, hasCaptionsUrl: !!captionsUrl });
      
      // Use the updated withRetry function with options object
      const { data, error } = await withRetry(() => supabase.functions.invoke("render-video", {
        body: requestBody
      }), { maxRetries: 3, delayMs: 1000 });
      
      if (error) {
        console.error("Error starting render:", error);
        showErrorToast(error.message);
        return { success: false, error: error.message };
      }
      
      if (!data || !data.renderId) {
        const errorMsg = data?.error || "No render ID returned";
        console.error(errorMsg);
        showErrorToast(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      console.log("Render started successfully with ID:", data.renderId);
      
      // Start monitoring the render status immediately
      this.pollRenderStatus(data.renderId, projectId, (status, url) => {
        console.log(`Polling callback: status=${status}, url=${url || 'none'}`);
      });
      
      return { success: true, renderId: data.renderId };
    } catch (error) {
      console.error("Exception in startRender:", error);
      showErrorToast(error instanceof Error ? error.message : String(error));
      return { success: false, error: String(error) };
    }
  },
  
  // New method to validate the Shotstack API key directly
  async validateShotstackApiKey(): Promise<boolean> {
    try {
      // Use the direct test flag to simplify API validation
      const { data, error } = await supabase.functions.invoke("test-shotstack", {
        body: { direct: true }
      });
      
      if (error) {
        console.error("Error validating Shotstack API key:", error);
        return false;
      }
      
      return data?.success === true;
    } catch (error) {
      console.error("Exception validating Shotstack API key:", error);
      return false;
    }
  },
  
  // Helper method to generate audio for a template from narration script
  async generateAudioForTemplate(narrationScript: string, projectId: string): Promise<string | undefined> {
    if (!narrationScript) return undefined;
    
    try {
      console.log("Generating audio from narration script");
      const { data, error } = await supabase.functions.invoke("generate-audio", {
        body: {
          text: narrationScript,
          title: `Audio for project ${projectId}`,
          voice: "alloy" // Default voice
        }
      });
      
      if (error) {
        console.error("Error generating audio:", error);
        return undefined;
      }
      
      if (!data?.audioContent) {
        console.error("No audio content returned");
        return undefined;
      }
      
      // Upload the audio content to storage
      console.log("Uploading generated audio to storage");
      const audioFileName = `${projectId}/audio-${Date.now()}.mp3`;
      
      // Convert base64 to blob
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('video-assets')
        .upload(audioFileName, audioBlob, {
          contentType: 'audio/mp3',
          upsert: true
        });
      
      if (uploadError) {
        console.error("Error uploading audio to storage:", uploadError);
        return undefined;
      }
      
      // Get public URL
      const { data: publicUrlData } = await supabase.storage
        .from('video-assets')
        .getPublicUrl(audioFileName);
      
      const audioUrl = publicUrlData?.publicUrl;
      console.log("Generated audio URL:", audioUrl);
      
      // Update project with audio URL
      try {
        const { error: updateError } = await supabase
          .from("video_projects")
          .update({ 
            audio_url: audioUrl,
            has_audio: true 
          })
          .eq("id", projectId);
          
        if (updateError) {
          console.error("Error updating project with audio URL:", updateError);
        }
      } catch (updateErr) {
        console.error("Exception updating project with audio URL:", updateErr);
      }
      
      return audioUrl;
    } catch (error) {
      console.error("Exception generating audio:", error);
      return undefined;
    }
  },
  
  // Helper method to generate narration from scenes
  generateNarrationFromScenes(scenes: any[]): string {
    if (!scenes || scenes.length === 0) return "";
    
    // Create a narrative by combining scene descriptions
    try {
      return scenes.map(scene => {
        // Extract the narrative content
        return scene.description || scene.scene || "";
      }).filter(text => text.trim().length > 0).join(". ");
    } catch (error) {
      console.error("Error generating narration from scenes:", error);
      return "";
    }
  },
  
  async checkRenderStatus(renderId: string, projectId: string): Promise<RenderResponse> {
    try {
      if (!renderId || !projectId) {
        console.error("Missing render ID or project ID in checkRenderStatus");
        return { status: 'failed', error: 'Missing render ID or project ID' };
      }
      
      console.log(`Checking render status for: ${renderId}`);
      
      const { data, error } = await withRetry(() => 
        supabase.functions.invoke("check-render-status", {
          body: { renderId, projectId }
        }),
        { maxRetries: 3, delayMs: 1000 }
      );
      
      if (error) {
        console.error("Error checking render status:", error);
        showErrorToast(error.message);
        return { status: 'failed', error: error.message };
      }
      
      if (!data) {
        console.error("No data returned from status check");
        return { status: 'failed', error: 'No data returned from status check' };
      }
      
      console.log("Render status response:", data);
      return data as RenderResponse;
    } catch (error) {
      console.error("Exception in checkRenderStatus:", error);
      showErrorToast(error instanceof Error ? error.message : String(error));
      return { status: 'failed', error: String(error) };
    }
  },
  
  pollRenderStatus(renderId: string, projectId: string, onUpdate: (status: RenderStatus, url?: string) => void): void {
    if (!renderId || !projectId) {
      console.error("Missing render ID or project ID in pollRenderStatus");
      onUpdate('failed', undefined);
      return;
    }
    
    console.log(`Starting render status polling for project ${projectId} with render ID ${renderId}`);
    toast.info("Video rendering in progress", {
      description: "We'll notify you when it's complete."
    });
    
    // Check initial status immediately
    const checkStatus = async () => {
      try {
        const response = await this.checkRenderStatus(renderId, projectId);
        console.log(`Initial status check: ${response.status}`);
        
        onUpdate(response.status as RenderStatus, response.url);
        
        // If not done or failed yet, start polling
        if (response.status !== 'completed' && response.status !== 'failed') {
          let attempts = 0;
          const maxAttempts = 30; // 5 minutes (10s interval)
          
          // Set polling interval
          const interval = setInterval(async () => {
            attempts++;
            console.log(`Polling attempt ${attempts} for render ${renderId}`);
            
            if (attempts >= maxAttempts) {
              clearInterval(interval);
              toast.error("Video rendering took too long", {
                description: "Please check back later or try again."
              });
              onUpdate('failed', undefined);
              
              // Update the project status to failed
              try {
                await renderStatusService.updateProjectStatus(projectId, 'failed', {
                  status: 'failed',
                  error: 'Rendering timeout - took too long to complete'
                });
              } catch (updateErr) {
                console.error("Error updating project status after timeout:", updateErr);
              }
              return;
            }
            
            try {
              const response = await this.checkRenderStatus(renderId, projectId);
              console.log(`Poll result: status=${response.status}, url=${response.url || 'none'}`);
              
              onUpdate(response.status as RenderStatus, response.url);
              
              if (response.status === 'completed' || response.status === 'failed') {
                clearInterval(interval);
                
                if (response.status === 'completed') {
                  toast.success("Video rendering complete", {
                    description: "Your video is ready to view"
                  });
                } else if (response.status === 'failed') {
                  toast.error("Video rendering failed", {
                    description: response.error || "Unknown error"
                  });
                }
              }
            } catch (error) {
              console.error("Error during polling:", error);
              // Don't clear interval, try again next time
            }
          }, 10000); // Check every 10 seconds
        }
      } catch (error) {
        console.error("Error during initial status check:", error);
        onUpdate('failed', undefined);
      }
    };
    
    // Start the polling process
    checkStatus();
  }
};
