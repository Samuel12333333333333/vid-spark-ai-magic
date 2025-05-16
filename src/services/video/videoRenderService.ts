
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
      
      // Make sure each scene has necessary properties
      const validatedScenes = scenes.map(scene => {
        // Ensure each scene has at least these properties
        return {
          scene: scene.scene || scene.title || "Unnamed Scene",
          description: scene.description || "",
          keywords: scene.keywords || [],
          duration: scene.duration || 5,
          videoUrl: scene.videoUrl || null
        };
      });
      
      // Log what we're sending for debugging
      console.log(`Validated ${validatedScenes.length} scenes`);
      
      try {
        // Check if at least one scene has a videoUrl
        const hasVideoUrl = validatedScenes.some(scene => scene.videoUrl);
        if (!hasVideoUrl) {
          console.log("No scenes have videoUrl property - Shotstack will search for stock videos");
        }
      } catch (err) {
        console.error("Error checking videoUrls:", err);
      }
      
      const { data, error } = await supabase.functions.invoke("render-video", {
        body: {
          projectId,
          userId: (await supabase.auth.getUser()).data.user?.id,
          prompt,
          style,
          scenes: validatedScenes,
          useStockMedia: true,
          has_audio: hasAudio,
          has_captions: hasCaptions,
          audioUrl,
          captionsUrl
        }
      });
      
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
      
      return { success: true, renderId: data.renderId };
    } catch (error) {
      console.error("Exception in startRender:", error);
      showErrorToast(error instanceof Error ? error.message : String(error));
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
        showErrorToast(error.message);
        return { status: 'failed', error: error.message };
      }
      
      if (!data) {
        return { status: 'failed', error: 'No data returned from status check' };
      }
      
      return data as RenderResponse;
    } catch (error) {
      console.error("Exception in checkRenderStatus:", error);
      showErrorToast(error instanceof Error ? error.message : String(error));
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
      
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes (10s interval)
      
      // Set polling interval
      const interval = setInterval(async () => {
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          toast.error("Video rendering took too long", {
            description: "Please check back later or try again."
          });
          return;
        }
        
        try {
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
        } catch (error) {
          console.error("Error during polling:", error);
          // Don't clear interval, try again next time
        }
      }, 10000); // Check every 10 seconds
    }
  }
};
