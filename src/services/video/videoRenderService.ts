
import { supabase } from "@/integrations/supabase/client";
import { RenderResponse, RenderStatus } from "./types";
import { toast } from "sonner";
import { showErrorToast, withRetry } from "@/lib/error-handler";

export const videoRenderService = {
  async startRender(
    projectId: string,
    prompt: string,
    style: string,
    scenes: any[] = [],
    hasAudio: boolean = false,
    hasCaptions: boolean = false,
    audioUrl?: string,
    captionsUrl?: string
  ): Promise<{ renderId?: string; success: boolean; error?: string }> {
    try {
      if (!scenes || scenes.length === 0) {
        console.error("No scenes provided for rendering");
        showErrorToast("No scenes provided for video rendering");
        return { success: false, error: "No scenes provided for video rendering" };
      }
      
      console.log(`Starting render for project ${projectId} with ${scenes.length} scenes`);
      
      // Extract any media URLs from scenes for easier access in the edge function
      const mediaUrls = scenes
        .map(scene => scene.videoUrl || scene.media_url || (scene.media && scene.media.url))
        .filter(Boolean);
        
      console.log(`Processed ${scenes.length} scenes with videos`);
      
      // Log the scenes being sent to verify the structure
      console.log("Starting render with scenes:", scenes);
      
      const { data, error } = await supabase.functions.invoke("render-video", {
        body: {
          projectId,
          userId: (await supabase.auth.getUser()).data.user?.id,
          prompt,
          style,
          scenes,
          mediaUrls,
          useStockMedia: true,
          has_audio: hasAudio,
          has_captions: hasCaptions,
          audioUrl,
          captionsUrl
        }
      });
      
      if (error) {
        console.error("Error starting render:", error);
        showErrorToast(error);
        return { success: false, error: error.message };
      }
      
      if (!data || !data.renderId) {
        const errorMsg = "No render ID returned";
        console.error(errorMsg);
        showErrorToast(errorMsg);
        return { success: false, error: errorMsg };
      }
      
      return { success: true, renderId: data.renderId };
    } catch (error) {
      console.error("Exception in startRender:", error);
      showErrorToast(error);
      return { success: false, error: String(error) };
    }
  },
  
  async checkRenderStatus(renderId: string, projectId: string): Promise<RenderResponse> {
    try {
      const { data, error } = await withRetry(() => 
        supabase.functions.invoke("check-render-status", {
          body: { renderId, projectId }
        })
      );
      
      if (error) {
        console.error("Error checking render status:", error);
        showErrorToast(error);
        return { status: 'failed', error: error.message };
      }
      
      return data as RenderResponse;
    } catch (error) {
      console.error("Exception in checkRenderStatus:", error);
      showErrorToast(error);
      return { status: 'failed', error: String(error) };
    }
  },
  
  async pollRenderStatus(renderId: string, projectId: string, onUpdate: (status: RenderStatus, url?: string) => void): Promise<void> {
    // Initial status check
    let response = await this.checkRenderStatus(renderId, projectId);
    onUpdate(response.status as RenderStatus, response.url);
    
    // If not done or failed yet, start polling
    if (response.status !== 'done' && response.status !== 'failed') {
      toast.info("Video rendering in progress", {
        description: "We'll notify you when it's complete."
      });
      
      // Set polling interval
      const interval = setInterval(async () => {
        response = await this.checkRenderStatus(renderId, projectId);
        onUpdate(response.status as RenderStatus, response.url);
        
        if (response.status === 'done') {
          clearInterval(interval);
          toast.success("Video rendering complete");
        } else if (response.status === 'failed') {
          clearInterval(interval);
          toast.error("Video rendering failed", {
            description: response.error || "Unknown error"
          });
        }
      }, 10000); // Check every 10 seconds
      
      // Clean up interval after 30 minutes (avoid endless polling)
      setTimeout(() => {
        clearInterval(interval);
      }, 30 * 60 * 1000);
    }
  }
};
