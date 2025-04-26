
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

  private async updateProjectStatus(projectId: string, status: RenderStatus, data: RenderResponse) {
    const { data: projectData } = await supabase
      .from('video_projects')
      .select('user_id, title')
      .eq('id', projectId)
      .single();

    if (!projectData?.user_id) {
      console.error("Cannot update status: user_id not found in project data");
      return;
    }

    if (status === 'completed' && data.url) {
      await supabase
        .from('video_projects')
        .update({
          status,
          video_url: data.url,
          thumbnail_url: data.thumbnail || null
        })
        .eq('id', projectId);

      await renderNotifications.createRenderCompleteNotification(
        projectData.user_id,
        projectData.title,
        projectId,
        data.url
      );
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
