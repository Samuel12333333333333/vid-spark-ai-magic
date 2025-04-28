
import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "../notificationService";
import { toast } from "sonner";

export const renderNotifications = {
  async createRenderStartNotification(userId: string, title: string, projectId: string): Promise<void> {
    if (!userId) {
      console.error("❌ Missing user ID for start notification");
      return;
    }

    try {
      await notificationService.createNotification({
        userId,
        title: "Video Rendering Started",
        message: `Your video "${title || 'Untitled'}" has started rendering.`,
        type: "video",
        metadata: { projectId, status: "processing" }
      });
      
      toast.info("Video rendering started", {
        description: "We'll notify you when your video is ready."
      });
    } catch (error) {
      console.error("Failed to create render start notification:", error);
    }
  },

  async createRenderCompleteNotification(userId: string, title: string, projectId: string, videoUrl: string): Promise<void> {
    if (!userId) {
      console.error("❌ Missing user ID for complete notification");
      return;
    }

    try {
      await notificationService.createNotification({
        userId,
        title: "Video Rendering Complete",
        message: `Your video "${title || 'Untitled'}" is ready to view!`,
        type: "video",
        metadata: { projectId, videoUrl, status: "completed" }
      });

      toast.success("Video rendering complete!", {
        description: "Your video is now ready to view.",
        action: {
          label: "View",
          onClick: () => window.location.href = `/dashboard/videos/${projectId}`
        }
      });
    } catch (error) {
      console.error("Failed to create render complete notification:", error);
    }
  },

  async createRenderFailedNotification(userId: string, title: string, projectId: string, errorMessage: string): Promise<void> {
    if (!userId) {
      console.error("❌ Missing user ID for failed notification");
      return;
    }

    try {
      await notificationService.createNotification({
        userId,
        title: "Video Rendering Failed",
        message: `Your video "${title || 'Untitled'}" could not be rendered. Please try again.`,
        type: "video",
        metadata: { projectId, error: errorMessage, status: "failed" }
      });

      toast.error("Video rendering failed", {
        description: "There was a problem creating your video. Please try again."
      });
    } catch (error) {
      console.error("Failed to create render failed notification:", error);
    }
  },
  
  async createVideoDeletedNotification(userId: string, title: string): Promise<void> {
    if (!userId) {
      console.error("❌ Missing user ID for video deleted notification");
      return;
    }

    try {
      await notificationService.createNotification({
        userId,
        title: "Video Deleted",
        message: `Your video "${title || 'Untitled'}" has been deleted.`,
        type: "video",
        metadata: { status: "deleted" }
      });

      toast.info("Video deleted", {
        description: "The video has been successfully deleted."
      });
    } catch (error) {
      console.error("Failed to create video deleted notification:", error);
    }
  },

  async handleRenderCompletedFlow(userId: string, title: string, projectId: string, finalUrl: string): Promise<void> {
    try {
      console.log("🎬 Handling render completed flow...");

      const { error } = await supabase
        .from("video_projects")
        .update({ status: "completed", video_url: finalUrl })
        .eq("id", projectId);

      if (error) {
        console.error("❌ Failed to update project to completed:", error);
      } else {
        console.log("✅ Project marked completed");
        await this.createRenderCompleteNotification(userId, title, projectId, finalUrl);
      }
    } catch (error) {
      console.error("❌ Error during handleRenderCompletedFlow:", error);
    }
  },

  async handleRenderFailedFlow(userId: string, title: string, projectId: string, errorMessage: string): Promise<void> {
    try {
      console.log("❌ Handling render failed flow...");

      const { error } = await supabase
        .from("video_projects")
        .update({ status: "failed", error_message: errorMessage })
        .eq("id", projectId);

      if (error) {
        console.error("❌ Failed to update project to failed:", error);
      } else {
        console.log("✅ Project marked failed");
        await this.createRenderFailedNotification(userId, title, projectId, errorMessage);
      }
    } catch (error) {
      console.error("❌ Error during handleRenderFailedFlow:", error);
    }
  }
};
