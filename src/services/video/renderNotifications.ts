
import { supabase } from "@/integrations/supabase/client";

/**
 * Service for creating notifications related to video rendering
 */
export const renderNotifications = {
  /**
   * Create a notification when a video render is complete
   */
  async createVideoCompleteNotification(userId: string, projectId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'video_complete',
          title: 'Video Ready',
          message: `Your video "${title}" is ready to view.`,
          link: `/dashboard/videos/${projectId}`,
          read: false
        });
        
      if (error) {
        console.error("Error creating video complete notification:", error);
      }
    } catch (error) {
      console.error("Error in createVideoCompleteNotification:", error);
    }
  },
  
  /**
   * Create a notification when a video render fails
   */
  async createVideoFailedNotification(userId: string, projectId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'video_failed',
          title: 'Video Generation Failed',
          message: `We encountered an issue generating "${title}".`,
          link: `/dashboard/videos/${projectId}`,
          read: false
        });
        
      if (error) {
        console.error("Error creating video failed notification:", error);
      }
    } catch (error) {
      console.error("Error in createVideoFailedNotification:", error);
    }
  },
  
  /**
   * Create a notification when a video is deleted
   */
  async createVideoDeletedNotification(userId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'video_deleted',
          title: 'Video Deleted',
          message: `Video "${title}" has been deleted.`,
          link: `/dashboard/videos`,
          read: false
        });
        
      if (error) {
        console.error("Error creating video deleted notification:", error);
      }
    } catch (error) {
      console.error("Error in createVideoDeletedNotification:", error);
    }
  }
};

export default renderNotifications;
