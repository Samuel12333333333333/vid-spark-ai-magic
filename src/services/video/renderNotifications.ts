
import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "../notificationService";
import { toast } from "sonner";

// Helper function for direct DB notification creation as a fallback
const createDirectNotification = async (notification) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select();
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error("Direct notification creation failed:", err);
    return null;
  }
};

export const renderNotifications = {
  async createRenderStartNotification(userId: string, title: string, projectId: string) {
    console.log(`Creating render start notification for user ${userId}, project ${projectId}`);
    
    if (!userId) {
      console.error("Cannot create notification: missing user ID");
      return;
    }
    
    // Create notification object
    const notification = {
      user_id: userId,
      title: "Video Rendering Started",
      message: `Your video "${title || 'Untitled'}" has started rendering.`,
      type: 'video',
      is_read: false,
      metadata: { projectId, status: 'processing' }
    };
    
    try {
      // Method 1: Use notification service
      const result = await notificationService.createNotification({
        userId,
        title: "Video Rendering Started",
        message: `Your video "${title || 'Untitled'}" has started rendering.`,
        type: 'video',
        metadata: { projectId, status: 'processing' }
      });
      
      // Method 2: Direct DB insertion if service method failed
      if (!result) {
        console.log("Notification service failed, trying direct insertion");
        await createDirectNotification(notification);
      }
      
      toast.info("Video rendering started", {
        description: "We'll notify you when your video is ready."
      });
    } catch (error) {
      console.error("All notification creation attempts failed:", error);
      // Try one last time with minimal data
      try {
        await createDirectNotification({
          user_id: userId,
          title: "Video Rendering Started",
          message: "Your video has started rendering.",
          type: 'video',
          is_read: false
        });
      } catch (finalError) {
        console.error("Final notification attempt failed:", finalError);
      }
    }
  },

  async createRenderCompleteNotification(userId: string, title: string, projectId: string, videoUrl: string) {
    console.log(`Creating render complete notification for user ${userId}, project ${projectId}`);
    
    if (!userId) {
      console.error("Cannot create notification: missing user ID");
      return;
    }
    
    // Create notification object
    const notification = {
      user_id: userId,
      title: "Video Rendering Complete",
      message: `Your video "${title || 'Untitled'}" is ready to view!`,
      type: 'video',
      is_read: false,
      metadata: { projectId, videoUrl }
    };
    
    try {
      // Method 1: Use notification service
      const result = await notificationService.createNotification({
        userId,
        title: "Video Rendering Complete",
        message: `Your video "${title || 'Untitled'}" is ready to view!`,
        type: 'video',
        metadata: { projectId, videoUrl }
      });
      
      // Method 2: Direct DB insertion if service method failed
      if (!result) {
        console.log("Notification service failed, trying direct insertion");
        await createDirectNotification(notification);
      }
      
      toast.success("Video rendering complete!", {
        description: "Your video is now ready to view.",
        action: {
          label: "View",
          onClick: () => window.location.href = `/dashboard/videos/${projectId}`
        }
      });
    } catch (error) {
      console.error("All notification creation attempts failed:", error);
      // Try one last time with minimal data
      try {
        await createDirectNotification({
          user_id: userId,
          title: "Video Rendering Complete",
          message: "Your video is ready to view!",
          type: 'video',
          is_read: false
        });
      } catch (finalError) {
        console.error("Final notification attempt failed:", finalError);
      }
    }
  },

  async createRenderFailedNotification(userId: string, title: string, projectId: string, errorMessage: string) {
    console.log(`Creating render failed notification for user ${userId}, project ${projectId}`);
    
    if (!userId) {
      console.error("Cannot create notification: missing user ID");
      return;
    }
    
    // Create notification object
    const notification = {
      user_id: userId,
      title: "Video Rendering Failed",
      message: `Your video "${title || 'Untitled'}" could not be rendered. Please try again.`,
      type: 'video',
      is_read: false,
      metadata: { projectId, error: errorMessage }
    };
    
    try {
      // Method 1: Use notification service
      const result = await notificationService.createNotification({
        userId,
        title: "Video Rendering Failed",
        message: `Your video "${title || 'Untitled'}" could not be rendered. Please try again.`,
        type: 'video',
        metadata: { projectId, error: errorMessage }
      });
      
      // Method 2: Direct DB insertion if service method failed
      if (!result) {
        console.log("Notification service failed, trying direct insertion");
        await createDirectNotification(notification);
      }
      
      toast.error("Video rendering failed", {
        description: "There was a problem creating your video. Please try again."
      });
    } catch (error) {
      console.error("All notification creation attempts failed:", error);
      // Try one last time with minimal data
      try {
        await createDirectNotification({
          user_id: userId,
          title: "Video Rendering Failed",
          message: "Your video could not be rendered. Please try again.",
          type: 'video',
          is_read: false
        });
      } catch (finalError) {
        console.error("Final notification attempt failed:", finalError);
      }
    }
  },

  // Handler for the complete flow
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
