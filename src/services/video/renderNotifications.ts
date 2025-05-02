
import { supabase } from "@/integrations/supabase/client";

export const renderNotifications = {
  async createVideoCompleteNotification(userId: string, projectId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'video_complete',
          title: 'Video Generation Complete',
          message: `Your video "${title}" is ready to view!`,
          link: `/dashboard/videos/${projectId}`,
          is_read: false
        });
        
      if (error) {
        console.error("Error creating notification:", error);
      }
    } catch (error) {
      console.error("Error in createVideoCompleteNotification:", error);
    }
  },
  
  async createVideoFailedNotification(userId: string, projectId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'video_failed',
          title: 'Video Generation Failed',
          message: `We couldn't create your video "${title}". Please try again.`,
          link: `/dashboard/videos/${projectId}`,
          is_read: false
        });
        
      if (error) {
        console.error("Error creating notification:", error);
      }
    } catch (error) {
      console.error("Error in createVideoFailedNotification:", error);
    }
  },
  
  async createVideoDeletedNotification(userId: string, title: string): Promise<void> {
    try {
      if (!userId) {
        console.warn("Missing userId for video deletion notification");
        return;
      }
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'video_deleted',
          title: 'Video Deleted',
          message: `Your video "${title}" has been deleted.`,
          link: `/dashboard/videos`,
          is_read: false
        });
        
      if (error) {
        console.error("Error creating notification:", error);
      } else {
        console.log("✅ Video deletion notification created successfully");
      }
    } catch (error) {
      console.error("Error in createVideoDeletedNotification:", error);
    }
  },
  
  // Add these two functions that are referenced in renderStatusService.ts
  async handleRenderCompletedFlow(userId: string, title: string, projectId: string, videoUrl: string): Promise<void> {
    try {
      console.log(`Video render completed for project ${projectId}`);
      
      // Create notification for user
      await this.createVideoCompleteNotification(userId, projectId, title);
      
    } catch (error) {
      console.error("Error in handleRenderCompletedFlow:", error);
    }
  },
  
  async handleRenderFailedFlow(userId: string, title: string, projectId: string, errorMessage: string): Promise<void> {
    try {
      console.log(`Video render failed for project ${projectId}: ${errorMessage}`);
      
      // Create notification for user
      await this.createVideoFailedNotification(userId, projectId, title);
      
    } catch (error) {
      console.error("Error in handleRenderFailedFlow:", error);
    }
  }
};
