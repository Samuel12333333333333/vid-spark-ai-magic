
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
      }
      
      // Then create notification - try multiple approaches for maximum reliability
      console.log(`Creating completion notification for user ${projectData.user_id}, project ${projectId}`);
      
      try {
        // First approach: Using our dedicated notification handler
        await renderNotifications.createRenderCompleteNotification(
          projectData.user_id,
          projectData.title,
          projectId,
          data.url
        );
        console.log("Notification creation process completed");
      } catch (notificationError) {
        console.error("Failed to create completion notification:", notificationError);
        
        // Second approach: Direct database insert as fallback
        try {
          console.log("Attempting direct database insert as fallback");
          
          const directNotification = {
            user_id: projectData.user_id,
            title: "Video Rendering Complete",
            message: `Your video "${projectData.title || 'Untitled'}" is ready to view!`,
            type: 'video',
            is_read: false
          };
          
          const { error: directError } = await supabase
            .from('notifications')
            .insert([directNotification]);
            
          if (directError) {
            console.error("Direct notification insert failed:", directError);
          } else {
            console.log("Direct notification insert succeeded");
          }
        } catch (directError) {
          console.error("All notification creation attempts failed:", directError);
        }
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
      }

      // Create failure notification with multiple fallback approaches
      try {
        await renderNotifications.createRenderFailedNotification(
          projectData.user_id,
          projectData.title,
          projectId,
          data.error || "Unknown error"
        );
      } catch (notificationError) {
        console.error("Failed to create failure notification:", notificationError);
        
        // Direct database insert as fallback
        try {
          const failureNotification = {
            user_id: projectData.user_id,
            title: "Video Rendering Failed",
            message: `Your video "${projectData.title || 'Untitled'}" could not be rendered.`,
            type: 'video',
            is_read: false
          };
          
          await supabase
            .from('notifications')
            .insert([failureNotification]);
        } catch (directError) {
          console.error("All failure notification attempts failed");
        }
      }
    } else {
      // For statuses other than completed or failed
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
  }
};
