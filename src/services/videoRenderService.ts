
import { supabase } from "@/integrations/supabase/client";
import { VideoProject } from "./videoService";

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
        // Update project with video URL
        await supabase
          .from('video_projects')
          .update({
            status: newStatus,
            video_url: data.url,
            thumbnail_url: data.thumbnail || null
          })
          .eq('id', projectId);
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
          prompt: project.prompt,
          style: project.style,
          hasAudio: project.has_audio,
          hasCaptions: project.has_captions,
          narrationScript: project.narration_script,
          brandColors: project.brand_colors,
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
      
      return data.renderId;
    } catch (error) {
      console.error("Error in startRender:", error);
      
      // Update project status to failed
      if (project.id) {
        await supabase
          .from('video_projects')
          .update({ status: 'failed' })
          .eq('id', project.id);
      }
      
      return null;
    }
  }
};
