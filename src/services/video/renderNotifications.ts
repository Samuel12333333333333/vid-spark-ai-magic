
import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "../notificationService";
import { toast } from "sonner";

export const renderNotifications = {
  async createRenderStartNotification(userId: string, title: string, projectId: string) {
    try {
      // Direct database insertion for reliability
      const startNotification = {
        user_id: userId,
        title: "Video Rendering Started",
        message: `Your video "${title || 'Untitled'}" has started rendering.`,
        type: 'video',
        is_read: false,
        metadata: { projectId, status: 'processing' }
      };

      const { error: directError } = await supabase
        .from('notifications')
        .insert([startNotification]);

      if (directError) {
        console.error("❌ Direct render start notification failed:", directError);
        // Try service method as backup
        await notificationService.createNotification({
          userId,
          title: "Video Rendering Started",
          message: `Your video "${title || 'Untitled'}" has started rendering.`,
          type: 'video',
          metadata: { projectId, status: 'processing' }
        });
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
      const notification = {
        user_id: userId,
        title: "Video Rendering Complete",
        message: `Your video "${title || 'Untitled'}" is ready to view!`,
        type: 'video',
        is_read: false,
        metadata: { projectId, videoUrl }
      };

      const { error } = await supabase
        .from('notifications')
        .insert([notification]);

      if (error) {
        console.error("❌ Direct completion notification failed:", error);
        // Try service method as backup
        await notificationService.createNotification({
          userId,
          title: "Video Rendering Complete",
          message: `Your video "${title || 'Untitled'}" is ready to view!`,
          type: 'video',
          metadata: { projectId, videoUrl }
        });
      }

      toast.success("Video rendering complete!", {
        description: "Your video is now ready to view.",
        action: {
          label: "View",
          onClick: () => window.location.href = `/dashboard/videos/${projectId}`
        }
      });
    } catch (error) {
      console.error("Error creating completion notification:", error);
    }
  },

  async createRenderFailedNotification(userId: string, title: string, projectId: string, error: string) {
    try {
      const notification = {
        user_id: userId,
        title: "Video Rendering Failed",
        message: `Your video "${title || 'Untitled'}" could not be rendered. Please try again.`,
        type: 'video',
        is_read: false,
        metadata: { projectId, error }
      };

      const { error: notifError } = await supabase
        .from('notifications')
        .insert([notification]);

      if (notifError) {
        console.error("❌ Direct failure notification failed:", notifError);
        // Try service method as backup
        await notificationService.createNotification({
          userId,
          title: "Video Rendering Failed",
          message: `Your video "${title || 'Untitled'}" could not be rendered. Please try again.`,
          type: 'video',
          metadata: { projectId, error }
        });
      }

      toast.error("Video rendering failed", {
        description: "There was a problem creating your video. Please try again."
      });
    } catch (error) {
      console.error("Error creating failure notification:", error);
    }
  }
};
