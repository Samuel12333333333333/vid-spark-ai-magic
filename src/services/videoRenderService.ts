
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
      
      if (newStatus === 'completed' && data.url) {
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
          await notificationService.createNotification({
            userId: projectData.user_id,
            title: "Video Rendering Complete",
            message: `Your video "${projectData.title || 'Untitled'}" is ready to view!`,
            type: 'video',
            metadata: { projectId, videoUrl: data.url }
          });
          
          // Show toast notification
          toast.success("Video rendering complete!", {
            description: "Your video is now ready to view.",
            action: {
              label: "View",
              onClick: () => window.location.href = `/dashboard/videos/${projectId}`
            }
          });
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
          .update({ status: newStatus })
          .eq('id', projectId);
          
        // Create notification for failed video
        if (projectData?.user_id) {
          await notificationService.createNotification({
            userId: projectData.user_id,
            title: "Video Rendering Failed",
            message: `Your video "${projectData.title || 'Untitled'}" could not be rendered. Please try again.`,
            type: 'video',
            metadata: { projectId, error: data.error || "Unknown error" }
          });
          
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
