import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "../notificationService";
import { toast } from "sonner";

export const renderNotifications = {
  async createRenderStartNotification(userId: string, title: string, projectId: string) {
    try {
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
      const completeNotification = {
        user_id: userId,
        title: "Video Rendering Complete",
        message: `Your video "${title || 'Untitled'}" is ready to view!`,
        type: 'video',
        is_read: false,
        metadata: { projectId, videoUrl }
      };

      const { error: directError } = await supabase
        .from('notifications')
        .insert([completeNotification]);

      if (directError) {
        console.error("❌ Direct completion notification failed:", directError);
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
      console.error("Error creating render complete notification:", error);
    }
  },

  async createRenderFailedNotification(userId: string, title: string, projectId: string, errorMessage: string) {
    try {
      const failNotification = {
        user_id: userId,
        title: "Video Rendering Failed",
        message: `Your video "${title || 'Untitled'}" could not be rendered. Please try again.`,
        type: 'video',
        is_read: false,
        metadata: { projectId, error: errorMessage }
      };

      const { error: directError } = await supabase
        .from('notifications')
        .insert([failNotification]);

      if (directError) {
        console.error("❌ Direct failure notification failed:", directError);
        await notificationService.createNotification({
          userId,
          title: "Video Rendering Failed",
          message: `Your video "${title || 'Untitled'}" could not be rendered. Please try again.`,
          type: 'video',
          metadata: { projectId, error: errorMessage }
        });
      }

      toast.error("Video rendering failed", {
        description: "There was a problem creating your video. Please try again."
      });
    } catch (error) {
      console.error("Error creating render failed notification:", error);
    }
  },

  // 🚀 Helper to handle full "completion" flow
  async handleRenderCompletedFlow(userId: string, title: string, projectId: string, finalUrl: string) {
    try {
      console.log("✅ Render completed. Updating project and sending notification...");

      // Update video project status
      await supabase
        .from('video_projects') // Change if your table is named differently
        .update({ status: "completed", final_url: finalUrl })
        .eq('id', projectId);

      // Create the notification
      await renderNotifications.createRenderCompleteNotification(userId, title, projectId, finalUrl);
    } catch (error) {
      console.error("Error handling render completed flow:", error);
    }
  },

  async handleRenderFailedFlow(userId: string, title: string, projectId: string, errorMessage: string) {
    try {
      console.log("❌ Render failed. Updating project and sending notification...");

      // Update video project status
      await supabase
        .from('video_projects') // Change if your table is named differently
        .update({ status: "failed" })
        .eq('id', projectId);

      // Create the notification
      await renderNotifications.createRenderFailedNotification(userId, title, projectId, errorMessage);
    } catch (error) {
      console.error("Error handling render failed flow:", error);
    }
  }
};
