
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notificationService } from "../notificationService";
import { RenderStartOptions, RenderStatus } from "./types";
import { renderNotifications } from "./renderNotifications";
import { renderStatusService } from "./renderStatusService";
import { VideoProject } from "../videoService";

export const videoRenderService = {
  async startRender({
    projectId,
    userId,
    prompt,
    style = 'social',
    hasAudio = false,
    hasCaptions = true,
    narrationScript,
    brandColors,
    includeCaptions,
    scenes,
    audioBase64
  }: RenderStartOptions): Promise<{ success: boolean; message: string; renderId?: string }> {
    try {
      console.log(`Starting render for project ${projectId} by user ${userId}`);
      
      // Create notification for render start
      await renderNotifications.createRenderStartNotification(
        userId,
        prompt.substring(0, 30) + "...", 
        projectId
      );
      
      // Prepare render request
      const renderRequest = {
        scenes,
        userId,
        projectId,
        audioBase64,
        includeCaptions,
        narrationScript,
        has_audio: hasAudio,
        has_captions: hasCaptions
      };
      
      // Call render-video edge function
      const { data, error } = await supabase.functions.invoke("render-video", {
        body: renderRequest
      });
      
      if (error) {
        console.error("Error starting render:", error);
        
        // Update project status to failed
        try {
          await supabase
            .from("video_projects")
            .update({
              status: "failed",
              error_message: error.message || "Failed to start rendering"
            })
            .eq("id", projectId);
        } catch (updateError) {
          console.error("Error updating project status after render failure:", updateError);
        }
        
        toast.error("Failed to start video rendering", {
          description: error.message
        });
        
        return {
          success: false,
          message: error.message || "Failed to start rendering"
        };
      }
      
      if (!data || !data.renderId) {
        console.error("Invalid response from render endpoint:", data);
        
        toast.error("Invalid response from render service");
        
        return {
          success: false,
          message: "Invalid response from render service"
        };
      }
      
      const renderId = data.renderId;
      console.log(`Render started with ID: ${renderId}`);
      
      // Get initial status
      const initialStatus: RenderStatus = await renderStatusService.updateRenderStatus(projectId, renderId);
      
      // Log project and render info
      console.log(`Project ${projectId} render status: ${initialStatus}`);
      
      return {
        success: true,
        message: "Render started successfully",
        renderId
      };
    } catch (error) {
      console.error("Error in startRender:", error);
      
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      
      toast.error("Failed to start video rendering", {
        description: errorMessage
      });
      
      // Update project status to failed
      try {
        await supabase
          .from("video_projects")
          .update({
            status: "failed",
            error_message: errorMessage
          })
          .eq("id", projectId);
      } catch (updateError) {
        console.error("Error updating project status:", updateError);
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }
};
