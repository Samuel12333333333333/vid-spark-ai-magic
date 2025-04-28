import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "../notificationService";
import { toast } from "sonner";

// Retryable direct DB notification creation
const createDirectNotification = async (notification, maxRetries = 3) => {
  let retries = 0;
  let lastError = null;
  
  while (retries < maxRetries) {
    try {
      console.log(`📝 Direct notification attempt ${retries + 1}/${maxRetries}`);
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select();
      if (!error) return data;
      lastError = error;
    } catch (err) {
      lastError = err;
    }
    retries++;
    await new Promise(res => setTimeout(res, 500 * retries));
  }
  
  console.error("❌ Direct notification failed after retries:", lastError);
  return null;
};

// Central notification sender
const sendNotification = async (notification) => {
  try {
    console.log("🔔 Trying notificationService...");
    const result = await notificationService.createNotification({
      userId: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      metadata: notification.metadata
    });
    if (result) return result;
    console.warn("⚠️ notificationService failed, falling back to direct insert...");
  } catch (error) {
    console.error("⚠️ notificationService exception, falling back:", error);
  }

  // Fallback
  return await createDirectNotification(notification);
};

export const renderNotifications = {
  async createRenderStartNotification(userId, title, projectId) {
    if (!userId) return console.error("❌ Missing user ID for start notification");

    const notification = {
      user_id: userId,
      title: "Video Rendering Started",
      message: `Your video "${title || 'Untitled'}" has started rendering.`,
      type: "video",
      is_read: false,
      metadata: { projectId, status: "processing" }
    };
    
    await sendNotification(notification);
    
    toast.info("Video rendering started", {
      description: "We'll notify you when your video is ready."
    });
  },

  async createRenderCompleteNotification(userId, title, projectId, videoUrl) {
    if (!userId) return console.error("❌ Missing user ID for complete notification");

    const notification = {
      user_id: userId,
      title: "Video Rendering Complete",
      message: `Your video "${title || 'Untitled'}" is ready to view!`,
      type: "video",
      is_read: false,
      metadata: { projectId, videoUrl }
    };

    await sendNotification(notification);

    toast.success("Video rendering complete!", {
      description: "Your video is now ready to view.",
      action: {
        label: "View",
        onClick: () => window.location.href = `/dashboard/videos/${projectId}`
      }
    });
  },

  async createRenderFailedNotification(userId, title, projectId, errorMessage) {
    if (!userId) return console.error("❌ Missing user ID for failed notification");

    const notification = {
      user_id: userId,
      title: "Video Rendering Failed",
      message: `Your video "${title || 'Untitled'}" could not be rendered. Please try again.`,
      type: "video",
      is_read: false,
      metadata: { projectId, error: errorMessage }
    };

    await sendNotification(notification);

    toast.error("Video rendering failed", {
      description: "There was a problem creating your video. Please try again."
    });
  },

  async handleRenderCompletedFlow(userId, title, projectId, finalUrl) {
    try {
      console.log("🎬 Handling render completed flow...");

      const { error } = await supabase
        .from("video_projects")
        .update({ status: "completed", video_url: finalUrl })
        .eq("id", projectId);

      if (error) console.error("❌ Failed to update project to completed:", error);
      else console.log("✅ Project marked completed");

      await this.createRenderCompleteNotification(userId, title, projectId, finalUrl);
    } catch (error) {
      console.error("❌ Error during handleRenderCompletedFlow:", error);
    }
  },

  async handleRenderFailedFlow(userId, title, projectId, errorMessage) {
    try {
      console.log("❌ Handling render failed flow...");

      const { error } = await supabase
        .from("video_projects")
        .update({ status: "failed", error_message: errorMessage })
        .eq("id", projectId);

      if (error) console.error("❌ Failed to update project to failed:", error);
      else console.log("✅ Project marked failed");

      await this.createRenderFailedNotification(userId, title, projectId, errorMessage);
    } catch (error) {
      console.error("❌ Error during handleRenderFailedFlow:", error);
    }
  }
};
