
import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "../notificationService";
import { toast } from "sonner";

export const renderNotifications = {
  async createRenderStartNotification(userId: string, title: string, projectId: string) {
    try {
      console.log(`Creating render start notification for user ${userId}, project ${projectId}`);
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
        console.error("Error details:", JSON.stringify(directError));
        
        // Try service method as backup
        const notification = await notificationService.createNotification({
          userId,
          title: "Video Rendering Started",
          message: `Your video "${title || 'Untitled'}" has started rendering.`,
          type: 'video',
          metadata: { projectId, status: 'processing' }
        });
        
        console.log("Backup notification created:", notification ? "success" : "failed");
      } else {
        console.log("✅ Render start notification created successfully");
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
      console.log(`Creating render complete notification for user ${userId}, project ${projectId}`);
      
      // Direct attempt with full error logging
      try {
        const notification = {
          user_id: userId,
          title: "Video Rendering Complete",
          message: `Your video "${title || 'Untitled'}" is ready to view!`,
          type: 'video',
          is_read: false,
          metadata: { projectId, videoUrl }
        };
        
        console.log("Attempting direct notification insert with payload:", JSON.stringify(notification));
  
        const { data, error } = await supabase
          .from('notifications')
          .insert([notification])
          .select();
  
        if (error) {
          console.error("❌ Direct completion notification failed:", error);
          console.error("Error details:", JSON.stringify(error));
          throw error; // Let the catch handle fallback
        }
        
        console.log("✅ Direct notification created successfully:", data);
      } catch (directError) {
        // Fallback to service method
        console.log("Attempting fallback notification creation via service");
        const backupNotification = await notificationService.createNotification({
          userId,
          title: "Video Rendering Complete",
          message: `Your video "${title || 'Untitled'}" is ready to view!`,
          type: 'video',
          metadata: { projectId, videoUrl }
        });
        
        console.log("Backup notification result:", backupNotification ? "success" : "failed");
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
      console.log(`Creating render failed notification for user ${userId}, project ${projectId}`);
      
      // Direct attempt with full error logging
      try {
        const notification = {
          user_id: userId,
          title: "Video Rendering Failed",
          message: `Your video "${title || 'Untitled'}" could not be rendered. Please try again.`,
          type: 'video', 
          is_read: false,
          metadata: { projectId, error }
        };
        
        console.log("Attempting direct notification insert with payload:", JSON.stringify(notification));
        
        const { data, error: notifError } = await supabase
          .from('notifications')
          .insert([notification])
          .select();
  
        if (notifError) {
          console.error("❌ Direct failure notification failed:", notifError);
          console.error("Error details:", JSON.stringify(notifError));
          throw notifError; // Let the catch handle fallback
        }
        
        console.log("✅ Failure notification created successfully:", data);
      } catch (directError) {
        // Fallback to service method
        console.log("Attempting fallback notification creation via service");
        const backupNotification = await notificationService.createNotification({
          userId,
          title: "Video Rendering Failed",
          message: `Your video "${title || 'Untitled'}" could not be rendered. Please try again.`,
          type: 'video',
          metadata: { projectId, error }
        });
        
        console.log("Backup notification result:", backupNotification ? "success" : "failed");
      }

      toast.error("Video rendering failed", {
        description: "There was a problem creating your video. Please try again."
      });
    } catch (error) {
      console.error("Error creating failure notification:", error);
    }
  }
};
