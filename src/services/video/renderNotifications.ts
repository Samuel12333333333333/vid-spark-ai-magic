
import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "../notificationService";
import { toast } from "sonner";

export const renderNotifications = {
  async createRenderStartNotification(userId: string, title: string, projectId: string) {
    try {
      console.log(`🔔 Creating render start notification for user ${userId}, project ${projectId}`);
      
      // Try direct insert first for maximum reliability
      const startNotification = {
        user_id: userId,
        title: "Video Rendering Started",
        message: `Your video "${title || 'Untitled'}" has started rendering.`,
        type: 'video',
        is_read: false,
        metadata: { projectId, status: 'processing' }
      };

      const { data, error: directError } = await supabase
        .from('notifications')
        .insert([startNotification])
        .select();

      if (directError) {
        console.error("❌ Direct render start notification failed:", directError);
        
        // Fallback to using the notification service
        await notificationService.createNotification({
          userId,
          title: "Video Rendering Started",
          message: `Your video "${title || 'Untitled'}" has started rendering.`,
          type: 'video',
          metadata: { projectId, status: 'processing' }
        });
      } else {
        console.log("✅ Start notification created successfully:", data);
      }

      toast.info("Video rendering started", {
        description: "We'll notify you when your video is ready."
      });
    } catch (error) {
      console.error("Error creating render started notification:", error);
    }
  },

  async createRenderCompleteNotification(userId: string, title: string, projectId: string, videoUrl: string) {
    try {
      console.log(`🔔 Creating render complete notification for user ${userId}, project ${projectId}`);
      console.log(`Video URL: ${videoUrl}`);
      
      // Try direct insert first for maximum reliability
      const completeNotification = {
        user_id: userId,
        title: "Video Rendering Complete",
        message: `Your video "${title || 'Untitled'}" is ready to view!`,
        type: 'video',
        is_read: false,
        metadata: { projectId, videoUrl }
      };

      const { data, error: directError } = await supabase
        .from('notifications')
        .insert([completeNotification])
        .select();

      if (directError) {
        console.error("❌ Direct completion notification failed:", directError);
        console.error("Error details:", directError.message);
        
        // First fallback: simplified notification without metadata
        try {
          const simpleNotification = {
            user_id: userId,
            title: "Video Rendering Complete",
            message: `Your video "${title || 'Untitled'}" is ready to view!`,
            type: 'video',
            is_read: false
          };
          
          const { data: simpleData, error: simpleError } = await supabase
            .from('notifications')
            .insert([simpleNotification])
            .select();
            
          if (simpleError) {
            console.error("❌ Simplified notification failed:", simpleError);
            
            // Second fallback: notification service
            const fallbackResult = await notificationService.createNotification({
              userId,
              title: "Video Rendering Complete",
              message: `Your video "${title || 'Untitled'}" is ready to view!`,
              type: 'video'
            });
            
            console.log("Fallback notification result:", fallbackResult);
          } else {
            console.log("✅ Simple notification created successfully:", simpleData);
          }
        } catch (fallbackError) {
          console.error("Both notification methods failed:", fallbackError);
        }
      } else {
        console.log("✅ Complete notification created successfully:", data);
      }

      toast.success("Video rendering complete!", {
        description: "Your video is now ready to view.",
        action: {
          label: "View",
          onClick: () => window.location.href = `/dashboard/videos/${projectId}`
        }
      });
    } catch (error) {
      console.error("Error creating render complete notification:", error);
    }
  },

  async createRenderFailedNotification(userId: string, title: string, projectId: string, errorMessage: string) {
    try {
      console.log(`🔔 Creating render failed notification for user ${userId}, project ${projectId}`);
      console.log(`Error: ${errorMessage}`);
      
      // Try direct insert first
      const failNotification = {
        user_id: userId,
        title: "Video Rendering Failed",
        message: `Your video "${title || 'Untitled'}" could not be rendered. Please try again.`,
        type: 'video',
        is_read: false,
        metadata: { projectId, error: errorMessage }
      };

      const { data, error: directError } = await supabase
        .from('notifications')
        .insert([failNotification])
        .select();

      if (directError) {
        console.error("❌ Direct failure notification failed:", directError);
        
        // Simplified fallback
        const simpleNotification = {
          user_id: userId,
          title: "Video Rendering Failed",
          message: `Your video "${title || 'Untitled'}" could not be rendered.`,
          type: 'video',
          is_read: false
        };
        
        const { error: simpleError } = await supabase
          .from('notifications')
          .insert([simpleNotification]);
          
        if (simpleError) {
          console.error("❌ Simplified failure notification failed:", simpleError);
          
          // Last resort: notification service
          await notificationService.createNotification({
            userId,
            title: "Video Rendering Failed",
            message: `Your video "${title || 'Untitled'}" could not be rendered.`,
            type: 'video'
          });
        }
      } else {
        console.log("✅ Failed notification created successfully:", data);
      }

      toast.error("Video rendering failed", {
        description: "There was a problem creating your video. Please try again."
      });
    } catch (error) {
      console.error("Error creating render failed notification:", error);
    }
  },

  // Helper to handle full "completion" flow
  async handleRenderCompletedFlow(userId: string, title: string, projectId: string, finalUrl: string) {
    try {
      console.log("✅ Render completed. Updating project and sending notification...");

      // Update video project status
      const { error: updateError } = await supabase
        .from('video_projects')
        .update({ status: "completed", video_url: finalUrl })
        .eq('id', projectId);
        
      if (updateError) {
        console.error("Failed to update video project:", updateError);
      } else {
        console.log(`Project ${projectId} updated with completed status and URL`);
      }

      // Create the notification
      await this.createRenderCompleteNotification(userId, title, projectId, finalUrl);
    } catch (error) {
      console.error("Error handling render completed flow:", error);
    }
  },

  async handleRenderFailedFlow(userId: string, title: string, projectId: string, errorMessage: string) {
    try {
      console.log("❌ Render failed. Updating project and sending notification...");

      // Update video project status
      const { error: updateError } = await supabase
        .from('video_projects')
        .update({ status: "failed", error_message: errorMessage })
        .eq('id', projectId);
        
      if (updateError) {
        console.error("Failed to update video project status to failed:", updateError);
      } else {
        console.log(`Project ${projectId} updated with failed status`);
      }

      // Create the notification
      await this.createRenderFailedNotification(userId, title, projectId, errorMessage);
    } catch (error) {
      console.error("Error handling render failed flow:", error);
    }
  }
};
