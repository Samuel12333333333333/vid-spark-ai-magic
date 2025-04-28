import { supabase } from "@/integrations/supabase/client";
import { mediaService } from "./mediaService";
import { renderNotifications } from "./video/renderNotifications";

export interface VideoProject {
  id: string;
  title: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  style?: string;
  media_source?: string;
  brand_colors?: string;
  voice_type?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  render_id?: string;
  has_audio?: boolean;
  has_captions?: boolean;
  narration_script?: string;
  scenes?: any[]; 
  audio_data?: string;
  error_message?: string;
}

export const videoService = {
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
      
      return processedData as VideoProject[];
    } catch (error) {
      console.error('Error in getProjects:', error);
      throw error;
    }
  },
  
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
      
      return processedData as VideoProject[];
    } catch (error) {
      console.error('Error in getRecentProjects:', error);
      throw error;
    }
  },
  
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
      
      return data as VideoProject;
    } catch (error) {
      console.error('Error in getProjectById:', error);
      throw error;
    }
  },
  
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
      
      const projectWithDefaults = {
        ...project,
        has_audio: Boolean(project.has_audio),
        has_captions: Boolean(project.has_captions),
        narration_script: project.narration_script || null
      };

      const { data, error } = await supabase
        .from('video_projects')
        .insert(projectWithDefaults)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating video project:', error);
        throw error;
      }
      
      console.log("Video project created successfully with ID:", data.id);
      return data as VideoProject;
    } catch (error) {
      console.error('Error in createProject:', error);
      throw error;
    }
  },
  
  async updateProject(id: string, updates: Partial<VideoProject>): Promise<void> {
    try {
      if (!id) {
        console.error("Missing project ID for update");
        throw new Error("Missing project ID");
      }
      
      const sanitizedUpdates = {
        ...updates,
        has_audio: updates.has_audio !== undefined ? Boolean(updates.has_audio) : undefined,
        has_captions: updates.has_captions !== undefined ? Boolean(updates.has_captions) : undefined,
        narration_script: updates.narration_script || undefined
      };

      console.log(`Updating video project ${id} with data:`, {
        status: sanitizedUpdates.status,
        has_audio: sanitizedUpdates.has_audio,
        has_captions: sanitizedUpdates.has_captions,
        narration_script: sanitizedUpdates.narration_script 
          ? (sanitizedUpdates.narration_script.substring(0, 20) + "...") 
          : "No change"
      });
      
      if (updates.video_url) {
        sanitizedUpdates.video_url = mediaService.validateVideoUrl(updates.video_url);
      }
      
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
