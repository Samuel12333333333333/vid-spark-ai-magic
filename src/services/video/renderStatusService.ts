
import { supabase } from "@/integrations/supabase/client";
import { RenderResponse, RenderStatus } from "./types";
import { renderNotifications } from "./renderNotifications";
import { showErrorToast } from "@/lib/error-handler";
import { toast } from "sonner";

export const renderStatusService = {
  async updateRenderStatus(projectId: string, renderId: string): Promise<RenderStatus> {
    try {
      if (!projectId || !renderId) {
        console.error("Missing project ID or render ID");
        return 'failed';
      }
      
      console.log(`Checking render status for project ${projectId} with render ID ${renderId}`);
      
      const { data, error } = await supabase.functions.invoke("check-render-status", {
        body: { renderId, projectId }
      });
      
      if (error) {
        console.error("Error checking render status:", error);
        showErrorToast(`Failed to check render status: ${error.message}`);
        return 'failed';
      }
      
      if (!data || !data.status) {
        console.error("Invalid response from render status check:", data);
        showErrorToast("Invalid response from render status check");
        return 'failed';
      }
      
      console.log("Render status check response:", data);
      
      // Map the Shotstack status to our application status
      const statusMap: Record<string, RenderStatus> = {
        'queued': 'pending',
        'fetching': 'processing',
        'rendering': 'processing',
        'saving': 'processing',
        'done': 'completed',
        'failed': 'failed'
      };
      
      // Get our application status from the map or use processing as default
      const newStatus = data.status || (data.rawStatus ? statusMap[data.rawStatus] : 'processing');
      
      // If we got a valid status, update the project
      if (newStatus && ['pending', 'processing', 'completed', 'failed'].includes(newStatus)) {
        await this.updateProjectStatus(projectId, newStatus, data);
        
        // Show user feedback based on status
        if (newStatus === 'completed' && data.url) {
          toast.success("Video rendering completed", {
            description: "Your video is ready to view"
          });
        } else if (newStatus === 'failed') {
          toast.error("Video rendering failed", {
            description: data.error || "Unknown error"
          });
        }
      } else {
        console.error("Invalid status received:", newStatus, "Raw status:", data.rawStatus);
      }
      
      return newStatus;
    } catch (error) {
      console.error("Error in updateRenderStatus:", error);
      showErrorToast(error instanceof Error ? error.message : String(error));
      return 'failed';
    }
  },

  async updateProjectStatus(projectId: string, status: RenderStatus, data: RenderResponse): Promise<void> {
    console.log(`Updating project ${projectId} status to ${status}`);
    
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('video_projects')
        .select('user_id, title, status')
        .eq('id', projectId)
        .single();

      if (projectError || !projectData?.user_id) {
        console.error("Error fetching project data:", projectError);
        return;
      }

      // Don't update if current status is already completed and we're trying to set processing
      if (projectData.status === 'completed' && status === 'processing') {
        console.log("Project is already completed, not updating to processing status");
        return;
      }

      const userId = projectData.user_id;
      const title = projectData.title;
      console.log(`Project belongs to user ${userId}, title: "${title}"`);

      // Update project based on status
      if (status === 'completed' && data.url) {
        // Update project with URL
        const { error: updateError } = await supabase
          .from('video_projects')
          .update({
            status,
            video_url: data.url,
            thumbnail_url: data.thumbnail || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);
          
        if (updateError) {
          console.error("Failed to update video project:", updateError);
          showErrorToast("Failed to update video project status");
        } else {
          console.log(`Project ${projectId} updated with completed status and URL: ${data.url}`);
          await renderNotifications.handleRenderCompletedFlow(userId, title, projectId, data.url);
        }
      } else if (status === 'failed') {
        // Update project with failed status
        const { error: updateError } = await supabase
          .from('video_projects')
          .update({ 
            status,
            error_message: data.error || "Unknown error",
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);
          
        if (updateError) {
          console.error("Failed to update video project status to failed:", updateError);
          showErrorToast("Failed to update video project status");
        } else {
          console.log(`Project ${projectId} updated with failed status`);
          await renderNotifications.handleRenderFailedFlow(userId, title, projectId, data.error || "Unknown error");
        }
      } else {
        // For other statuses, just update the project
        const { error: updateError } = await supabase
          .from('video_projects')
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);
          
        if (updateError) {
          console.error(`Failed to update project to ${status} status:`, updateError);
          showErrorToast("Failed to update video project status");
        } else {
          console.log(`Project ${projectId} updated with ${status} status`);
        }
      }
    } catch (error) {
      console.error("Error updating project status:", error);
      showErrorToast(error instanceof Error ? error.message : String(error));
    }
  }
};
