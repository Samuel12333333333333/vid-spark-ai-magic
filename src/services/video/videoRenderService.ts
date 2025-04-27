import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { renderNotifications } from "./renderNotifications";

export const videoRenderService = {
  async generateVideo(projectData) {
    try {
      console.log("Starting video generation process");
      const { title, prompt, style, userId } = projectData;
      
      // Create project record first
      const { data: project, error: projectError } = await supabase
        .from('video_projects')
        .insert([{
          title,
          prompt,
          style,
          user_id: userId,
          status: 'rendering',
        }])
        .select()
        .single();
        
      if (projectError || !project) {
        console.error("Error creating video project:", projectError);
        toast.error("Failed to start video generation");
        return null;
      }
      
      // Create "started" notification immediately
      await renderNotifications.createRenderStartNotification(
        userId,
        title,
        project.id
      );
      
      console.log(`Project created successfully with ID: ${project.id}`);
      
      // Invoke render function
      const { data: renderData, error: renderError } = await supabase.functions.invoke("render-video", {
        body: { 
          projectId: project.id,
          prompt,
          style,
          title
        },
      });
      
      if (renderError || !renderData) {
        console.error("Error starting render:", renderError);
        
        // Update project with error status
        await supabase
          .from('video_projects')
          .update({ 
            status: 'failed',
            error_message: renderError?.message || "Failed to start rendering"
          })
          .eq('id', project.id);
        
        // Create failure notification 
        await renderNotifications.createRenderFailedNotification(
          userId,
          title,
          project.id, 
          renderError?.message || "Failed to start rendering"
        );
        
        toast.error("Failed to generate video");
        return null;
      }

      console.log("Render initiated:", renderData);
      
      // Update project with render ID
      await supabase
        .from('video_projects')
        .update({ render_id: renderData.renderId })
        .eq('id', project.id);
        
      return project;
    } catch (error) {
      console.error("Exception in generateVideo:", error);
      toast.error("An unexpected error occurred");
      return null;
    }
  },

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
