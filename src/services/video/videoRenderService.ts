
import { supabase } from "@/integrations/supabase/client";
import { VideoProject } from "../videoService";
import { renderStatusService } from "./renderStatusService";
import { renderNotifications } from "./renderNotifications";
import { RenderStatus } from "./types";

export const videoRenderService = {
  updateRenderStatus(projectId: string, renderId: string): Promise<RenderStatus> {
    return renderStatusService.updateRenderStatus(projectId, renderId);
  },
  
  async startRender(project: VideoProject): Promise<string | null> {
    try {
      if (!project.id || !project.prompt || !project.style) {
        console.error("Missing required project fields for rendering");
        throw new Error("Incomplete project data");
      }
      
      console.log(`Starting render for project ${project.id}`);
      
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
      
      if (error || !data?.renderId) {
        console.error("Error starting render:", error);
        throw new Error("Failed to get render ID");
      }
      
      await supabase
        .from('video_projects')
        .update({
          render_id: data.renderId,
          status: 'processing'
        })
        .eq('id', project.id);
      
      await renderNotifications.createRenderStartNotification(
        project.user_id,
        project.title,
        project.id
      );
      
      return data.renderId;
    } catch (error) {
      console.error("Error in startRender:", error);
      
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
