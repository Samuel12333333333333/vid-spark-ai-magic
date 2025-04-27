
import { supabase } from "@/integrations/supabase/client";
import { VideoProject } from "@/services/videoService";
import { RenderStatus, RenderResponse } from "./types";
import { renderStatusService } from "./renderStatusService";
import { toast } from "sonner";

export const videoRenderService = {
  async renderVideo(projectId: string, sceneData: any): Promise<boolean> {
    try {
      console.log("Starting render service for project:", projectId);

      // Fetch the project to make sure it exists and get its data
      const { data: project, error: projectError } = await supabase
        .from('video_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        console.error("Error fetching project:", projectError);
        toast.error("Failed to start video rendering - Project not found");
        return false;
      }

      // Update project status to processing
      const { error: updateError } = await supabase
        .from('video_projects')
        .update({ status: 'processing' })
        .eq('id', projectId);

      if (updateError) {
        console.error("Error updating project status:", updateError);
        toast.error("Failed to update project status");
        return false;
      }

      try {
        // Start the rendering process
        console.log("Calling render-video function with project:", projectId);
        const { data, error } = await supabase.functions.invoke("render-video", {
          body: { 
            projectId,
            scenes: sceneData.scenes,
            captions: project.has_captions || false
          }
        });

        if (error) {
          console.error("Error calling render function:", error);
          
          // Update project status to failed
          await supabase
            .from('video_projects')
            .update({ 
              status: 'failed',
              error_message: error.message || "Failed to start rendering process" 
            })
            .eq('id', projectId);
            
          toast.error("Failed to start video rendering");
          return false;
        }

        if (!data || !data.renderId) {
          console.error("Render function did not return a proper response", data);
          
          // Update project status to failed
          await supabase
            .from('video_projects')
            .update({ 
              status: 'failed',
              error_message: "Invalid response from rendering service" 
            })
            .eq('id', projectId);
            
          toast.error("Invalid response from rendering service");
          return false;
        }

        console.log("Got render ID:", data.renderId);
        
        // Update project with render ID
        await supabase
          .from('video_projects')
          .update({ render_id: data.renderId })
          .eq('id', projectId);
          
        toast.success("Video rendering started");

        // Start polling for status
        await this.startStatusPolling(projectId, data.renderId);
        
        return true;
      } catch (invokeError) {
        console.error("Exception in render function invocation:", invokeError);
        
        // Update project status to failed
        await supabase
          .from('video_projects')
          .update({ 
            status: 'failed',
            error_message: invokeError.message || "Exception during render function invocation" 
          })
          .eq('id', projectId);
          
        toast.error("Exception during render function invocation");
        return false;
      }
    } catch (error) {
      console.error("Error in renderVideo:", error);
      toast.error("An unexpected error occurred");
      return false;
    }
  },

  async startStatusPolling(projectId: string, renderId: string): Promise<void> {
    console.log("Starting status polling for project:", projectId, "render ID:", renderId);
    
    // Initial delay before first check
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    let status: RenderStatus = 'processing';
    let attempts = 0;
    const maxAttempts = 20; // Prevent infinite polling
    
    while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
      attempts++;
      console.log(`Polling attempt ${attempts}/${maxAttempts}`);
      
      try {
        // Use the renderStatusService to check status and update the project
        status = await renderStatusService.updateRenderStatus(projectId, renderId);
        
        console.log(`Status check result: ${status}`);
        
        if (status === 'completed') {
          console.log("Rendering completed successfully!");
          break;
        } else if (status === 'failed') {
          console.error("Rendering failed");
          break;
        }
        
        // Wait before next poll - increase delay for each attempt
        const delay = Math.min(5000 + (attempts * 2000), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        console.error("Error in status polling:", error);
        
        // Continue polling despite errors, but log them
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    if (attempts >= maxAttempts && status !== 'completed' && status !== 'failed') {
      console.error("Maximum polling attempts reached without completion");
      
      // Update project as failed due to timeout
      await renderStatusService.updateProjectStatus(projectId, 'failed', {
        error: "Rendering timed out after maximum polling attempts"
      } as RenderResponse);
    }
  }
};
