
import { supabase } from "@/integrations/supabase/client";
import { VideoProject } from "./videoService";
import { notificationService } from "./notificationService";
import { toast } from "sonner";

// This service handles video rendering operations
export const videoRenderService = {
  async updateRenderStatus(projectId: string, renderId: string): Promise<'pending' | 'processing' | 'completed' | 'failed'> {
    try {
      // Validate inputs
      if (!projectId || !renderId) {
        console.error("Missing project ID or render ID");
        return 'failed';
      }
      
      console.log(`Checking render status for project ${projectId} with render ID ${renderId}`);
      
      // Call the edge function to check render status
      const { data, error } = await supabase.functions.invoke("check-render-status", {
        body: { renderId }
      });
      
      if (error) {
        console.error("Error checking render status:", error);
        return 'failed';
      }
      
      if (!data || !data.status) {
        console.error("Invalid response from render status check");
        return 'failed';
      }
      
      // Map Shotstack status to our status format
      const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
        'queued': 'pending',
        'fetching': 'processing',
        'rendering': 'processing',
        'saving': 'processing',
        'done': 'completed',
        'failed': 'failed'
      };
      
      const newStatus = statusMap[data.status] || 'processing';
      console.log(`Video render status updated to ${newStatus} for project ${projectId}`);
      
      if (newStatus === 'completed' && data.url) {
        console.log(`Video render completed for project ${projectId}. URL: ${data.url}`);
        
        // Get user ID for notifications
        const { data: projectData } = await supabase
          .from('video_projects')
          .select('user_id, title')
          .eq('id', projectId)
          .single();
          
        // Update project with video URL
        await supabase
          .from('video_projects')
          .update({
            status: newStatus,
            video_url: data.url,
            thumbnail_url: data.thumbnail || null
          })
          .eq('id', projectId);
          
        // Create notification for completed video
        if (projectData?.user_id) {
          console.log("Creating notification for completed video:", projectData.title);
          
          try {
            const notificationData = {
              userId: projectData.user_id,
              title: "Video Rendering Complete",
              message: `Your video "${projectData.title || 'Untitled'}" is ready to view!`,
              type: 'video' as const,
              metadata: { projectId, videoUrl: data.url }
            };
            
            console.log("Notification data being sent:", notificationData);
            
            // Direct database insertion as a fallback to ensure notification is created
            const { error: directInsertError, data: directInsertData } = await supabase
              .from('notifications')
              .insert([{
                user_id: projectData.user_id,
                title: notificationData.title,
                message: notificationData.message,
                type: notificationData.type,
                is_read: false,
                metadata: notificationData.metadata
              }])
              .select()
              .single();
              
            if (directInsertError) {
              console.error("❌ Direct notification insert failed:", directInsertError);
            } else {
              console.log("✅ Notification created directly:", directInsertData.id);
            }
            
            // Also try using the notification service for completeness
            const notification = await notificationService.createNotification(notificationData);
            
            if (notification) {
              console.log("✅ Notification service created notification:", notification.id);
            } else {
              console.error("⚠️ Notification service returned null");
            }
            
            // Show toast notification
            toast.success("Video rendering complete!", {
              description: "Your video is now ready to view.",
              action: {
                label: "View",
                onClick: () => window.location.href = `/dashboard/videos/${projectId}`
              }
            });
          } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
            
            // Show toast even if notification creation fails
            toast.success("Video rendering complete!", {
              description: "Your video is now ready to view.",
              action: {
                label: "View",
                onClick: () => window.location.href = `/dashboard/videos/${projectId}`
              }
            });
          }
        } else {
          console.error("Cannot create notification: user_id not found in project data");
        }
      } else if (newStatus === 'failed') {
        // Get user ID for notifications
        const { data: projectData } = await supabase
          .from('video_projects')
          .select('user_id, title')
          .eq('id', projectId)
          .single();
          
        // Update project status to failed
        await supabase
          .from('video_projects')
          .update({ 
            status: newStatus,
            error_message: data.error || "Unknown error" 
          })
          .eq('id', projectId);
          
        // Create notification for failed video
        if (projectData?.user_id) {
          try {
            // Direct database insertion to ensure notification is created
            const { error: directInsertError } = await supabase
              .from('notifications')
              .insert([{
                user_id: projectData.user_id,
                title: "Video Rendering Failed",
                message: `Your video "${projectData.title || 'Untitled'}" could not be rendered. Please try again.`,
                type: 'video',
                is_read: false,
                metadata: { projectId, error: data.error || "Unknown error" }
              }]);
              
            if (directInsertError) {
              console.error("❌ Direct notification insert failed:", directInsertError);
            } else {
              console.log("✅ Failure notification created directly");
            }
            
            // Also try the notification service
            await notificationService.createNotification({
              userId: projectData.user_id,
              title: "Video Rendering Failed",
              message: `Your video "${projectData.title || 'Untitled'}" could not be rendered. Please try again.`,
              type: 'video',
              metadata: { projectId, error: data.error || "Unknown error" }
            });
          } catch (notificationError) {
            console.error("Error creating notification for failed rendering:", notificationError);
          }
          
          // Show error toast
          toast.error("Video rendering failed", {
            description: "There was a problem creating your video. Please try again."
          });
        }
      } else {
        // Just update status
        await supabase
          .from('video_projects')
          .update({ status: newStatus })
          .eq('id', projectId);
      }
      
      return newStatus;
    } catch (error) {
      console.error("Error in updateRenderStatus:", error);
      return 'failed';
    }
  },
  
  async startRender(project: VideoProject): Promise<string | null> {
    try {
      // Validate required project fields
      if (!project.id || !project.prompt || !project.style) {
        console.error("Missing required project fields for rendering");
        throw new Error("Incomplete project data");
      }
      
      console.log(`Starting render for project ${project.id}`);
      
      // Call the render-video edge function
      const { data, error } = await supabase.functions.invoke("render-video", {
        body: { 
          projectId: project.id,
          userId: project.user_id,
          prompt: project.prompt,
          style: project.style,
          hasAudio: project.has_audio,
          hasCaptions: project.has_captions,
          narrationScript: project.narration_script,
          brandColors: project.brand_colors,
          includeCaptions: project.has_captions,
          scenes: project.scenes || [], 
          audioBase64: project.audio_data 
        }
      });
      
      if (error) {
        console.error("Error starting render:", error);
        throw error;
      }
      
      if (!data || !data.renderId) {
        console.error("Invalid response from render-video function");
        throw new Error("Failed to get render ID");
      }
      
      // Update project with render ID
      await supabase
        .from('video_projects')
        .update({
          render_id: data.renderId,
          status: 'processing'
        })
        .eq('id', project.id);
      
      // Create a notification that rendering has started
      try {
        const { data: directInsertData, error: directInsertError } = await supabase
          .from('notifications')
          .insert([{
            user_id: project.user_id,
            title: "Video Rendering Started",
            message: `Your video "${project.title || 'Untitled'}" has started rendering.`,
            type: 'video',
            is_read: false,
            metadata: { projectId: project.id, status: 'processing' }
          }])
          .select();
          
        if (directInsertError) {
          console.error("❌ Render started notification failed:", directInsertError);
        } else {
          console.log("✅ Render started notification created:", directInsertData);
        }
      } catch (notificationError) {
        console.error("Error creating render started notification:", notificationError);
      }
      
      // Show toast notification for rendering started
      toast.info("Video rendering started", {
        description: "We'll notify you when your video is ready."
      });
      
      return data.renderId;
    } catch (error) {
      console.error("Error in startRender:", error);
      
      // Show error toast
      toast.error("Failed to start rendering", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      
      // Update project status to failed
      if (project.id) {
        await supabase
          .from('video_projects')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : "Unknown error"
          })
          .eq('id', project.id);
      }
      
      return null;
    }
  }
};
