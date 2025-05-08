
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const renderNotifications = {
  async createVideoCompletedNotification(userId: string, videoId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: "Video Ready",
          message: `Your video "${title.substring(0, 30)}${title.length > 30 ? '...' : ''}" is ready to view.`,
          type: "video_complete",
          is_read: false,
          metadata: { videoId, timestamp: new Date().toISOString() }
        });
        
      if (error) {
        console.error("Error creating video completed notification:", error);
      }
    } catch (error) {
      console.error("Exception in createVideoCompletedNotification:", error);
    }
  },
  
  async createVideoFailedNotification(userId: string, videoId: string, title: string, errorMessage?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
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
        
      if (error) {
        console.error("Error creating video failed notification:", error);
      }
    } catch (error) {
      console.error("Exception in createVideoFailedNotification:", error);
    }
  },
  
  async createVideoDeletedNotification(userId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: "Video Deleted",
          message: `Your video "${title.substring(0, 30)}${title.length > 30 ? '...' : ''}" has been deleted.`,
          type: "video_deleted",
          is_read: false,
          metadata: { action: "delete", timestamp: new Date().toISOString() }
        });
        
      if (error) {
        console.error("Error creating video deleted notification:", error);
      }
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
  }
};

export default renderNotifications;
