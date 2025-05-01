
import { supabase } from "@/integrations/supabase/client";
import { RenderResponse, RenderStatus } from "./types";
import { renderNotifications } from "./renderNotifications";

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
        return 'failed';
      }
      
      if (!data || !data.status) {
        console.error("Invalid response from render status check");
        return 'failed';
      }
      
      const statusMap: Record<string, RenderStatus> = {
        'queued': 'pending',
        'fetching': 'processing',
        'rendering': 'processing',
        'saving': 'processing',
        'done': 'completed',
        'failed': 'failed'
      };
      
      const newStatus = statusMap[data.status] || 'processing';
      await this.updateProjectStatus(projectId, newStatus, data);
      
      return newStatus;
    } catch (error) {
      console.error("Error in updateRenderStatus:", error);
      return 'failed';
    }
  },

  async updateProjectStatus(projectId: string, status: RenderStatus, data: RenderResponse): Promise<void> {
    console.log(`Updating project ${projectId} status to ${status}`);
    
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('video_projects')
        .select('user_id, title')
        .eq('id', projectId)
        .single();

      if (projectError || !projectData?.user_id) {
        console.error("Error fetching project data:", projectError);
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
            thumbnail_url: data.thumbnail || null
          })
          .eq('id', projectId);
          
        if (updateError) {
          console.error("Failed to update video project:", updateError);
        } else {
          console.log(`Project ${projectId} updated with completed status and URL`);
          await renderNotifications.handleRenderCompletedFlow(userId, title, projectId, data.url);
        }
      } else if (status === 'failed') {
        // Update project with failed status
        const { error: updateError } = await supabase
          .from('video_projects')
          .update({ 
            status,
            error_message: data.error || "Unknown error"
          })
          .eq('id', projectId);
          
        if (updateError) {
          console.error("Failed to update video project status to failed:", updateError);
        } else {
          console.log(`Project ${projectId} updated with failed status`);
          await renderNotifications.handleRenderFailedFlow(userId, title, projectId, data.error || "Unknown error");
        }
      } else {
        // For other statuses, just update the project
        const { error: updateError } = await supabase
          .from('video_projects')
          .update({ status })
          .eq('id', projectId);
          
        if (updateError) {
          console.error(`Failed to update project to ${status} status:`, updateError);
        } else {
          console.log(`Project ${projectId} updated with ${status} status`);
        }
      }
    } catch (error) {
      console.error("Error updating project status:", error);
    }
  }
};
