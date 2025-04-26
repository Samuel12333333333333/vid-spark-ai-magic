
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

  // Removed 'private' keyword as it's not valid in this context
  async updateProjectStatus(projectId: string, status: RenderStatus, data: RenderResponse) {
    console.log(`Updating project ${projectId} status to ${status}`);
    
    const { data: projectData } = await supabase
      .from('video_projects')
      .select('user_id, title')
      .eq('id', projectId)
      .single();

    if (!projectData?.user_id) {
      console.error("Cannot update status: user_id not found in project data");
      return;
    }

    console.log(`Project belongs to user ${projectData.user_id}, title: "${projectData.title}"`);

    if (status === 'completed' && data.url) {
      console.log(`Video complete, URL: ${data.url}`);
      // First update the project
      await supabase
        .from('video_projects')
        .update({
          status,
          video_url: data.url,
          thumbnail_url: data.thumbnail || null
        })
        .eq('id', projectId);
      
      // Then create notification with full debug logging
      console.log(`Creating completion notification for user ${projectData.user_id}`);
      await renderNotifications.createRenderCompleteNotification(
        projectData.user_id,
        projectData.title,
        projectId,
        data.url
      );
      console.log("Notification creation process completed");
      
    } else if (status === 'failed') {
      await supabase
        .from('video_projects')
        .update({ 
          status,
          error_message: data.error || "Unknown error" 
        })
        .eq('id', projectId);

      await renderNotifications.createRenderFailedNotification(
        projectData.user_id,
        projectData.title,
        projectId,
        data.error || "Unknown error"
      );
    } else {
      await supabase
        .from('video_projects')
        .update({ status })
        .eq('id', projectId);
    }
  }
};
