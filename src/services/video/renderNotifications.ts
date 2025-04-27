import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "../notificationService";
import { toast } from "sonner";

// Direct DB notification creation with multiple retry attempts
const createDirectNotification = async (notification, maxRetries = 3) => {
  let retries = 0;
  let success = false;
  let lastError = null;
  
  while (retries < maxRetries && !success) {
    try {
      console.log(`Creating direct notification (attempt ${retries + 1}/${maxRetries}):`, notification);
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select();
        
      if (error) {
        lastError = error;
        console.error(`Attempt ${retries + 1} failed:`, error);
        retries++;
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 500 * retries));
      } else {
        success = true;
        console.log("✅ Direct notification created successfully:", data);
        return data;
      }
    } catch (err) {
      lastError = err;
      console.error(`Exception in attempt ${retries + 1}:`, err);
      retries++;
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 500 * retries));
    }
  }
  
  if (!success) {
    console.error(`Failed to create notification after ${maxRetries} attempts:`, lastError);
  }
  
  return null;
};

export const renderNotifications = {
  async createRenderStartNotification(userId: string, title: string, projectId: string) {
    console.log(`🔔 Creating render start notification for user ${userId}, project ${projectId}`);
    
    if (!userId) {
      console.error("❌ Cannot create notification: missing user ID");
      return;
    }
    
    // Create notification object - keeping it simple for maximum reliability
    const notification = {
      user_id: userId,
      title: "Video Rendering Started",
      message: `Your video "${title || 'Untitled'}" has started rendering.`,
      type: 'video',
      is_read: false,
      metadata: { projectId, status: 'processing' }
    };
    
    try {
      // Method 1: Use notificationService
      console.log("Attempting to create notification via notificationService");
      const result = await notificationService.createNotification({
        userId,
        title: "Video Rendering Started",
        message: `Your video "${title || 'Untitled'}" has started rendering.`,
        type: 'video',
        metadata: { projectId, status: 'processing' }
      });
      
      if (result) {
        console.log("✅ Notification created successfully via notificationService");
      } else {
        // Method 2: Direct DB insertion as fallback
        console.log("notificationService failed, trying direct insertion");
        await createDirectNotification(notification);
      }
      
      toast.info("Video rendering started", {
        description: "We'll notify you when your video is ready."
      });
    } catch (error) {
      console.error("❌ First notification attempt failed:", error);
      // Final fallback method - direct insertion with simple data
      try {
        console.log("Attempting final direct notification fallback");
        await createDirectNotification({
          user_id: userId,
          title: "Video Rendering Started",
          message: "Your video has started rendering.",
          type: 'video',
          is_read: false
        });
      } catch (finalError) {
        console.error("❌❌ All notification attempts failed:", finalError);
      }
    }
  },

  async createRenderCompleteNotification(userId: string, title: string, projectId: string, videoUrl: string) {
    console.log(`🔔 Creating render complete notification for user ${userId}, project ${projectId}, video ${videoUrl}`);
    
    if (!userId) {
      console.error("❌ Cannot create notification: missing user ID");
      return;
    }
    
    // Create notification object - keeping it simple for maximum reliability
    const notification = {
      user_id: userId,
      title: "Video Rendering Complete",
      message: `Your video "${title || 'Untitled'}" is ready to view!`,
      type: 'video',
      is_read: false,
      metadata: { projectId, videoUrl }
    };
    
    try {
      // Method 1: Use notificationService
      console.log("Attempting to create completion notification via notificationService");
      const result = await notificationService.createNotification({
        userId,
        title: "Video Rendering Complete",
        message: `Your video "${title || 'Untitled'}" is ready to view!`,
        type: 'video',
        metadata: { projectId, videoUrl }
      });
      
      if (result) {
        console.log("✅ Completion notification created successfully via notificationService");
      } else {
        // Method 2: Direct DB insertion as fallback
        console.log("notificationService failed for completion notification, trying direct insertion");
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
      console.error("❌ Completion notification attempt failed:", error);
      // Final fallback method - direct insertion with simple data
      try {
        console.log("Attempting final direct completion notification fallback");
        await createDirectNotification({
          user_id: userId,
          title: "Video Rendering Complete",
          message: "Your video is ready to view!",
          type: 'video',
          is_read: false
        });
      } catch (finalError) {
        console.error("❌❌ All completion notification attempts failed:", finalError);
      }
    }
  },

  async createRenderFailedNotification(userId: string, title: string, projectId: string, errorMessage: string) {
    console.log(`🔔 Creating render failed notification for user ${userId}, project ${projectId}`);
    
    if (!userId) {
      console.error("❌ Cannot create notification: missing user ID");
      return;
    }
    
    // Create notification object - keeping it simple for maximum reliability
    const notification = {
      user_id: userId,
      title: "Video Rendering Failed",
      message: `Your video "${title || 'Untitled'}" could not be rendered. Please try again.`,
      type: 'video',
      is_read: false,
      metadata: { projectId, error: errorMessage }
    };
    
    try {
      // Method 1: Use notificationService
      console.log("Attempting to create failure notification via notificationService");
      const result = await notificationService.createNotification({
        userId,
        title: "Video Rendering Failed",
        message: `Your video "${title || 'Untitled'}" could not be rendered. Please try again.`,
        type: 'video',
        metadata: { projectId, error: errorMessage }
      });
      
      if (result) {
        console.log("✅ Failure notification created successfully via notificationService");
      } else {
        // Method 2: Direct DB insertion as fallback
        console.log("notificationService failed for failure notification, trying direct insertion");
        await createDirectNotification(notification);
      }
      
      toast.error("Video rendering failed", {
        description: "There was a problem creating your video. Please try again."
      });
    } catch (error) {
      console.error("❌ Failure notification attempt failed:", error);
      // Final fallback method - direct insertion with simple data
      try {
        console.log("Attempting final direct failure notification fallback");
        await createDirectNotification({
          user_id: userId,
          title: "Video Rendering Failed",
          message: "Your video could not be rendered. Please try again.",
          type: 'video',
          is_read: false
        });
      } catch (finalError) {
        console.error("❌❌ All failure notification attempts failed:", finalError);
      }
    }
  },

  // Handler for the complete flow
  async handleRenderCompletedFlow(userId: string, title: string, projectId: string, finalUrl: string) {
    try {
      console.log("✅ Render completed. Updating project and sending notification...");
      console.log(`Video URL: ${finalUrl}`);
      console.log(`User ID: ${userId}`);
      console.log(`Project ID: ${projectId}`);

      // Update video project status
      const { error: updateError } = await supabase
        .from('video_projects')
        .update({ 
          status: "completed", 
          video_url: finalUrl 
        })
        .eq('id', projectId);
        
      if (updateError) {
        console.error("Failed to update video project:", updateError);
      } else {
        console.log(`Project ${projectId} updated with completed status and URL`);
      }

      // Create the notification - try multiple approaches
      // First with notificationService
      try {
        await this.createRenderCompleteNotification(userId, title, projectId, finalUrl);
      } catch (error) {
        // If that fails, try direct database insertion
        console.error("Notification service method failed:", error);
        
        await createDirectNotification({
          user_id: userId,
          title: "Video Rendering Complete",
          message: `Your video "${title || 'Untitled'}" is ready to view!`,
          type: 'video',
          is_read: false
        });
      }
    } catch (error) {
      console.error("Error handling render completed flow:", error);
    }
  },

  async handleRenderFailedFlow(userId: string, title: string, projectId: string, errorMessage: string) {
    try {
      console.log("❌ Render failed. Updating project and sending notification...");
      console.log(`Error message: ${errorMessage}`);
      console.log(`User ID: ${userId}`);
      console.log(`Project ID: ${projectId}`);

      // Update video project status
      const { error: updateError } = await supabase
        .from('video_projects')
        .update({ 
          status: "failed", 
          error_message: errorMessage 
        })
        .eq('id', projectId);
        
      if (updateError) {
        console.error("Failed to update video project status to failed:", updateError);
      } else {
        console.log(`Project ${projectId} updated with failed status`);
      }

      // Create the notification - try multiple approaches
      try {
        await this.createRenderFailedNotification(userId, title, projectId, errorMessage);
      } catch (error) {
        console.error("Notification service method failed for failure notification:", error);
        
        // Direct insertion fallback
        await createDirectNotification({
          user_id: userId,
          title: "Video Rendering Failed",
          message: `Your video "${title || 'Untitled'}" could not be rendered.`,
          type: 'video',
          is_read: false
        });
      }
    } catch (error) {
      console.error("Error handling render failed flow:", error);
    }
  }
};
