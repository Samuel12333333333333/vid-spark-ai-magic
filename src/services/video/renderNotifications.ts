
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notificationService } from "@/services/notificationService";

// Use auth service role for server-side notifications
export const renderNotifications = {
  async createVideoCompletedNotification(userId: string, videoId: string, title: string): Promise<void> {
    try {
      await notificationService.createNotification({
        user_id: userId,
        title: "Video Ready",
        message: `Your video "${title.substring(0, 30)}${title.length > 30 ? '...' : ''}" is ready to view.`,
        type: "video_complete",
        is_read: false,
        metadata: { videoId, timestamp: new Date().toISOString() }
      });
    } catch (error) {
      console.error("Exception in createVideoCompletedNotification:", error);
    }
  },
  
  async createVideoFailedNotification(userId: string, videoId: string, title: string, errorMessage?: string): Promise<void> {
    try {
      await notificationService.createNotification({
        user_id: userId,
        title: "Video Generation Failed",
        message: `We couldn't generate your video "${title.substring(0, 30)}${title.length > 30 ? '...' : ''}". Please try again.`,
        type: "video_failed",
        is_read: false,
        metadata: { 
          videoId, 
          errorMessage,
          timestamp: new Date().toISOString() 
        }
      });
    } catch (error) {
      console.error("Exception in createVideoFailedNotification:", error);
    }
  },
  
  async createVideoDeletedNotification(userId: string, title: string): Promise<void> {
    try {
      await notificationService.createNotification({
        user_id: userId,
        title: "Video Deleted",
        message: `Your video "${title.substring(0, 30)}${title.length > 30 ? '...' : ''}" has been deleted.`,
        type: "video_deleted",
        is_read: false,
        metadata: { action: "delete", timestamp: new Date().toISOString() }
      });
    } catch (error) {
      console.error("Exception in createVideoDeletedNotification:", error);
    }
  },

  // Show UI toast for video-related events
  showVideoCompletedToast(title: string): void {
    toast.success(`Your video "${title.substring(0, 30)}${title.length > 30 ? '...' : ''}" is ready to view.`, {
      duration: 5000
    });
  },
  
  showVideoFailedToast(title: string, errorMessage?: string): void {
    toast.error(`Video generation failed: ${errorMessage || 'Unknown error'}`, {
      duration: 5000
    });
  },
  
  // Add the missing handler methods
  async handleRenderCompletedFlow(userId: string, title: string, projectId: string, videoUrl: string): Promise<void> {
    try {
      // Create notification
      await this.createVideoCompletedNotification(userId, projectId, title);
      
      // Show toast
      this.showVideoCompletedToast(title);
      
      console.log(`Render completed flow executed for project ${projectId}`);
    } catch (error) {
      console.error("Error in handleRenderCompletedFlow:", error);
    }
  },
  
  async handleRenderFailedFlow(userId: string, title: string, projectId: string, errorMessage: string): Promise<void> {
    try {
      // Create notification
      await this.createVideoFailedNotification(userId, projectId, title, errorMessage);
      
      // Show toast
      this.showVideoFailedToast(title, errorMessage);
      
      console.log(`Render failed flow executed for project ${projectId}: ${errorMessage}`);
    } catch (error) {
      console.error("Error in handleRenderFailedFlow:", error);
    }
  }
};

export default renderNotifications;
