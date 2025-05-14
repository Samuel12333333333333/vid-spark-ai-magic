
import { supabase } from "@/integrations/supabase/client";
import { VideoProject } from "@/services/videoService";
import { VideoProjectUpdate } from "@/services/video/types";
import { Json } from "@/integrations/supabase/types";
import { mediaService } from "@/services/mediaService";
import { renderNotifications } from "@/services/video/renderNotifications";

export const videoProjectService = {
  /**
   * Get all projects for the current user
   */
  async getProjects(): Promise<VideoProject[]> {
    try {
      const { data, error } = await supabase
        .from('video_projects')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching video projects:', error);
        throw error;
      }
      
      const processedData = (data || []).map(project => ({
        ...project,
        video_url: mediaService.validateVideoUrl(project.video_url),
        has_audio: Boolean(project.has_audio),
        has_captions: Boolean(project.has_captions)
      }));
      
      return processedData as unknown as VideoProject[];
    } catch (error) {
      console.error('Error in getProjects:', error);
      throw error;
    }
  },
  
  /**
   * Get recent projects with a limit
   */
  async getRecentProjects(limit: number = 3): Promise<VideoProject[]> {
    try {
      const { data, error } = await supabase
        .from('video_projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) {
        console.error('Error fetching recent video projects:', error);
        throw error;
      }
      
      const processedData = (data || []).map(project => ({
        ...project,
        video_url: mediaService.validateVideoUrl(project.video_url),
        has_audio: Boolean(project.has_audio),
        has_captions: Boolean(project.has_captions)
      }));
      
      return processedData as unknown as VideoProject[];
    } catch (error) {
      console.error('Error in getRecentProjects:', error);
      throw error;
    }
  },
  
  /**
   * Get a project by ID
   */
  async getProjectById(id: string): Promise<VideoProject | null> {
    try {
      if (!id) {
        console.error("Invalid project ID provided to getProjectById");
        return null;
      }
      
      const { data, error } = await supabase
        .from('video_projects')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error(`Error fetching video project with id ${id}:`, error);
        return null;
      }
      
      if (data) {
        data.video_url = mediaService.validateVideoUrl(data.video_url);
        data.has_audio = Boolean(data.has_audio);
        data.has_captions = Boolean(data.has_captions);
      }
      
      return data as unknown as VideoProject;
    } catch (error) {
      console.error('Error in getProjectById:', error);
      throw error;
    }
  },
  
  /**
   * Create a new project
   */
  async createProject(project: Omit<VideoProject, 'id' | 'created_at' | 'updated_at'>): Promise<VideoProject | null> {
    try {
      if (!project.title || !project.prompt || !project.user_id) {
        console.error("Missing required fields for project creation");
        throw new Error("Missing required fields for project creation");
      }
      
      console.log("Creating video project with data:", {
        title: project.title,
        style: project.style,
        has_audio: project.has_audio === true ? "Yes" : "No",
        has_captions: project.has_captions === true ? "Yes" : "No",
        narration_script: project.narration_script?.substring(0, 20) + "..." || "None provided"
      });
      
      const projectToInsert = {
        ...project,
        has_audio: Boolean(project.has_audio),
        has_captions: Boolean(project.has_captions),
        narration_script: project.narration_script || null,
        scenes: project.scenes ? (project.scenes as unknown as Json) : null
      };

      const { data, error } = await supabase
        .from('video_projects')
        .insert(projectToInsert)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating video project:', error);
        throw error;
      }
      
      console.log("Video project created successfully with ID:", data.id);
      return data as unknown as VideoProject;
    } catch (error) {
      console.error('Error in createProject:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing project
   */
  async updateProject(id: string, updates: Partial<VideoProject>): Promise<void> {
    try {
      if (!id) {
        console.error("Missing project ID for update");
        throw new Error("Missing project ID");
      }
      
      // Only include specific properties to update and ensure scenes is properly handled
      const sanitizedUpdates: VideoProjectUpdate = {};
      
      // Only copy the properties we want to update
      if (updates.title !== undefined) sanitizedUpdates.title = updates.title;
      if (updates.prompt !== undefined) sanitizedUpdates.prompt = updates.prompt;
      if (updates.status !== undefined) sanitizedUpdates.status = updates.status;
      if (updates.style !== undefined) sanitizedUpdates.style = updates.style;
      if (updates.media_source !== undefined) sanitizedUpdates.media_source = updates.media_source;
      if (updates.brand_colors !== undefined) sanitizedUpdates.brand_colors = updates.brand_colors;
      if (updates.voice_type !== undefined) sanitizedUpdates.voice_type = updates.voice_type;
      if (updates.video_url !== undefined) sanitizedUpdates.video_url = mediaService.validateVideoUrl(updates.video_url);
      if (updates.thumbnail_url !== undefined) sanitizedUpdates.thumbnail_url = updates.thumbnail_url;
      if (updates.narration_script !== undefined) sanitizedUpdates.narration_script = updates.narration_script;
      if (updates.error_message !== undefined) sanitizedUpdates.error_message = updates.error_message;
      if (updates.has_audio !== undefined) sanitizedUpdates.has_audio = Boolean(updates.has_audio);
      if (updates.has_captions !== undefined) sanitizedUpdates.has_captions = Boolean(updates.has_captions);
      if (updates.duration !== undefined) sanitizedUpdates.duration = updates.duration;
      if (updates.render_id !== undefined) sanitizedUpdates.render_id = updates.render_id;
      if (updates.audio_url !== undefined) sanitizedUpdates.audio_url = updates.audio_url;
      if (updates.scenes !== undefined) sanitizedUpdates.scenes = updates.scenes as unknown as Json;

      console.log(`Updating video project ${id} with data:`, {
        status: sanitizedUpdates.status,
        has_audio: sanitizedUpdates.has_audio,
        has_captions: sanitizedUpdates.has_captions,
        narration_script: sanitizedUpdates.narration_script 
          ? (sanitizedUpdates.narration_script.substring(0, 20) + "...") 
          : "No change",
        scenes: sanitizedUpdates.scenes ? `Present` : "No change",
        audio_url: sanitizedUpdates.audio_url || "No change"
      });
      
      const { error } = await supabase
        .from('video_projects')
        .update(sanitizedUpdates)
        .eq('id', id);
        
      if (error) {
        console.error(`Error updating video project with id ${id}:`, error);
        throw error;
      }
      
      console.log(`Video project ${id} updated successfully`);
    } catch (error) {
      console.error('Error in updateProject:', error);
      throw error;
    }
  },
  
  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    try {
      if (!id) {
        console.error("Missing project ID for deletion");
        throw new Error("Missing project ID");
      }
      
      const { data: projectData, error: fetchError } = await supabase
        .from('video_projects')
        .select('title, user_id')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error(`Error fetching project data before deletion with id ${id}:`, fetchError);
      }
      
      const { error } = await supabase
        .from('video_projects')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error(`Error deleting video project with id ${id}:`, error);
        throw error;
      }
      
      console.log(`Video project ${id} deleted successfully`);
      
      if (projectData && projectData.user_id) {
        await renderNotifications.createVideoDeletedNotification(
          projectData.user_id,
          projectData.title || 'Untitled'
        );
      }
    } catch (error) {
      console.error('Error in deleteProject:', error);
      throw error;
    }
  }
};
