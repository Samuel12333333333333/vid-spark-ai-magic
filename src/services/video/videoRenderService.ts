import { supabase } from "@/integrations/supabase/client";
import { RenderResponse, RenderStatus } from "./types";
import { toast } from "sonner";
import { showErrorToast, withRetry } from "@/lib/error-handler";
import { renderStatusService } from "./renderStatusService";
import { VideoRenderOptions, RenderRequestBody } from "@/types/custom-types";
import { useSubscription } from "@/contexts/SubscriptionContext";

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
      console.log(`Using template:`, template ? `yes (id: ${template.id || 'unknown'})` : 'no');
      
      // Check subscription status before rendering
      const { data: subscriptionData, error: subscriptionError } = await withRetry(() => 
        supabase.functions.invoke("check-subscription"), 
        { maxRetries: 2, delayMs: 1000 }
      );
      
      if (subscriptionError) {
        console.warn("Could not verify subscription, proceeding with caution:", subscriptionError);
      }
      
      const subscription = subscriptionData?.subscription;
      const hasActiveSubscription = subscription && subscription.status === 'active';
      const isPro = hasActiveSubscription && subscription?.plan_name?.toLowerCase().includes('pro');
      const isBusiness = hasActiveSubscription && subscription?.plan_name?.toLowerCase().includes('business');
      
      console.log(`Subscription status: ${hasActiveSubscription ? 'active' : 'inactive'}, tier: ${isPro ? 'pro' : isBusiness ? 'business' : 'free'}`);
      
      // Template tier restrictions
      if (template) {
        // If template is marked as premium but user doesn't have subscription
        if (template.is_premium && !hasActiveSubscription) {
          console.error("Premium template requires subscription");
          showErrorToast("This template requires a subscription");
          return { success: false, error: "Premium template requires subscription" };
        }
        
        // If template requires pro tier
        if (template.is_pro_only && !isPro && !isBusiness) {
          console.error("This template requires Pro subscription");
          showErrorToast("This template requires Pro subscription or higher");
          return { success: false, error: "Pro subscription required" };
        }
        
        // If template requires business tier
        if (template.is_business_only && !isBusiness) {
          console.error("This template requires Business subscription");
          showErrorToast("This template requires Business subscription");
          return { success: false, error: "Business subscription required" };
        }
      }
      
      // Check usage quota before proceeding with render
      const { data: usageData, error: usageError } = await withRetry(() => 
        supabase.functions.invoke("get_video_usage"),
        { maxRetries: 2, delayMs: 1000 }
      );
      
      if (usageError) {
        console.warn("Could not verify usage quota, proceeding with caution:", usageError);
      } else if (usageData) {
        const videosLimit = hasActiveSubscription 
          ? isPro 
            ? 20 
            : isBusiness 
              ? 50 
              : 2 // Free tier
          : 2; // Default to free
        
        console.log(`Video usage: ${usageData.count || 0}/${videosLimit}`);
        
        if (usageData.count >= videosLimit) {
          console.error("Usage quota exceeded");
          showErrorToast(`You've reached your limit of ${videosLimit} videos. Please upgrade your plan to create more videos.`);
          return { success: false, error: "Usage quota exceeded" };
        }
      }
      
      // Test the Shotstack API connection before proceeding
      try {
        console.log("Testing Shotstack API connection before rendering");
        const shotstackApiKey = await this.validateShotstackApiKey();
        
        if (!shotstackApiKey) {
          console.error("Shotstack API key validation failed");
          showErrorToast("Failed to validate Shotstack API key. Please check your API key in project settings.");
          return { success: false, error: "Shotstack API key validation failed" };
        }
        
        console.log("Shotstack API connection validated successfully");
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
      
      console.log("Sending render-video request with parameters:", { 
        projectId,
        style,
        hasTemplate: !!template,
        scenesCount: scenes?.length || 0,
        hasAudio, 
        hasCaptions,
        hasAudioUrl: !!audioUrl, 
        hasCaptionsUrl: !!captionsUrl 
      });
      
      // Use the updated withRetry function with options object
      const renderResult = await withRetry(() => supabase.functions.invoke("render-video", {
        body: requestBody
      }), { 
        maxRetries: 2, 
        delayMs: 1000,
        onRetry: (attempt, error) => {
          console.log(`Retrying render attempt ${attempt} after error:`, error);
        } 
      });
      
      if (renderResult.error) {
        console.error("Error starting render:", renderResult.error);
        showErrorToast(renderResult.error.message || "Failed to start render");
        return { success: false, error: renderResult.error.message || "Failed to start render" };
      }
      
      const data = renderResult.data;
      
      if (!data || !data.renderId) {
        const errorMsg = data?.error || "No render ID returned";
        console.error(errorMsg);
        showErrorToast(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      console.log("Render started successfully with ID:", data.renderId);
      
      // Update usage statistics after successful render start
      try {
        await supabase.functions.invoke("increment_video_usage");
      } catch (usageErr) {
        console.warn("Failed to increment usage stats, but render has started:", usageErr);
        // Don't block render success just because usage stats failed
      }
      
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
  
  // Validate the Shotstack API key specifically
  async validateShotstackApiKey(): Promise<boolean> {
    try {
      console.log("Validating Shotstack API key");
      
      // Use the direct test flag to simplify API validation
      const { data, error } = await withRetry(() => supabase.functions.invoke("test-shotstack", {
        body: { direct: true }
      }), {
        maxRetries: 2,
        delayMs: 1000
      });
      
      if (error) {
        console.error("Error validating Shotstack API key:", error);
        return false;
      }
      
      if (!data || data.success !== true) {
        console.error("Shotstack API key validation failed:", data?.message || "Unknown error");
        return false;
      }
      
      console.log("Shotstack API key is valid");
      return true;
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
        showErrorToast(error.message || "Error checking render status");
        return { status: 'failed', error: error.message || "Error checking render status" };
      }
      
      if (!data) {
        console.error("No data returned from status check");
        return { status: 'failed', error: 'No data returned from status check' };
      }
      
      console.log("Render status response:", data);
      
      // If there are error details, log them for debugging
      if (data.errorDetails) {
        console.error("Render error details:", data.errorDetails);
      }
      
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
