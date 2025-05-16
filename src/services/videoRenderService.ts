
import { supabase } from "@/integrations/supabase/client";

/**
 * Video render service - handles the status checking and processing for videos
 */
export const videoRenderService = {
  /**
   * Poll the render status of a video until it completes or fails
   */
  async pollRenderStatus(rendererId: string, projectId: string): Promise<string> {
    if (!rendererId || !projectId) {
      console.error("Missing renderer ID or project ID");
      return "failed";
    }
    
    let status = "processing";
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (with 5s interval)
    const interval = 5000; // 5 seconds
    
    try {
      console.log(`Starting poll for render status: ${rendererId}, project: ${projectId}`);
      
      while (status === "processing" && attempts < maxAttempts) {
        attempts++;
        
        // Call the edge function to check render status
        const { data, error } = await supabase.functions.invoke("check-render-status", {
          body: { renderId: rendererId, projectId }
        });
        
        if (error) {
          console.error("Error checking render status:", error);
          if (attempts >= 3) {
            // After 3 failed attempts, consider it an error
            throw new Error(`Failed to check render status: ${error.message}`);
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, interval));
          continue;
        }
        
        console.log(`Render status check attempt ${attempts}, status:`, data?.status);
        
        if (data && (data.status === "done" || data.status === "failed")) {
          status = data.status;
          return data.status; // Return immediately if done or failed
        }
        
        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, interval));
      }
      
      if (attempts >= maxAttempts) {
        console.warn("Max polling attempts reached, returning current status:", status);
      }
      
      return status;
    } catch (error) {
      console.error("Error in pollRenderStatus:", error);
      
      // Update project status to failed
      try {
        await supabase
          .from("video_projects")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : String(error),
            updated_at: new Date().toISOString()
          })
          .eq("id", projectId);
      } catch (updateError) {
        console.error("Failed to update project status:", updateError);
      }
      
      return "failed";
    }
  },
  
  /**
   * Get the URL of the generated video
   */
  async getVideoUrl(projectId: string): Promise<string | null> {
    if (!projectId) {
      console.error("Missing project ID");
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from("video_projects")
        .select("video_url, status")
        .eq("id", projectId)
        .single();
        
      if (error) {
        console.error("Error retrieving video URL:", error);
        return null;
      }
      
      if (data && data.status === "done" && data.video_url) {
        return data.video_url;
      }
      
      return null;
    } catch (error) {
      console.error("Error in getVideoUrl:", error);
      return null;
    }
  }
};

export default videoRenderService;
