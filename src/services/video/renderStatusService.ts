
import { supabase } from "@/integrations/supabase/client";
import { RenderResponse, RenderStatus } from "./types";
import { renderNotifications } from "./renderNotifications";
import { notificationService } from "@/services/notificationService";
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

      console.log(`Project belongs to user ${projectData.user_id}, title: "${projectData.title}"`);

      // Update project status
      if (status === 'completed' && data.url) {
        // Create notification for video completion
        console.log(`Creating notification for completed video: ${data.url}`);
        
        const notification = {
          user_id: projectData.user_id,
          title: "Video Rendering Complete",
          message: `Your video "${projectData.title || 'Untitled'}" is ready to view!`,
          type: 'video',
          is_read: false,
          metadata: { 
            projectId, 
            videoUrl: data.url,
            status: 'completed'
          }
        };

        // Insert notification with retry mechanism
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            console.log(`Attempt ${retries + 1} to insert completion notification`);
            const { error: notifError } = await supabase
              .from('notifications')
              .insert([notification]);
              
            if (!notifError) {
              console.log("✅ Video completion notification created successfully");
              toast.success("Video rendering complete!", {
                description: "Your video is now ready to view.",
                action: {
                  label: "View",
                  onClick: () => window.location.href = `/dashboard/videos/${projectId}`
                }
              });
              break;
            }
            
            console.error(`Failed to create completion notification (attempt ${retries + 1}):`, notifError);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          } catch (err) {
            console.error(`Notification creation attempt ${retries + 1} failed:`, err);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }

        // Update project with URL regardless of notification status
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
      } else if (status === 'failed') {
        // Create notification for video failure
        const notification = {
          user_id: projectData.user_id,
          title: "Video Rendering Failed",
          message: `Your video "${projectData.title || 'Untitled'}" could not be rendered. Please try again.`,
          type: 'video',
          is_read: false,
          metadata: { 
            projectId,
            error: data.error || 'Unknown error',
            status: 'failed'
          }
        };

        // Insert failure notification
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            console.log(`Attempt ${retries + 1} to insert failure notification`);
            const { error: notifError } = await supabase
              .from('notifications')
              .insert([notification]);
              
            if (!notifError) {
              console.log("✅ Video failure notification created successfully");
              toast.error("Video rendering failed", {
                description: "There was a problem creating your video. Please try again."
              });
              break;
            }
            
            console.error(`Failed to create failure notification (attempt ${retries + 1}):`, notifError);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          } catch (err) {
            console.error(`Failure notification creation attempt ${retries + 1} failed:`, err);
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }

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
