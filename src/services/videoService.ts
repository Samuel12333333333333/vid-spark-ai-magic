
import { supabase } from "@/integrations/supabase/client";
import { mediaService } from "./mediaService";

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
      
      // Validate video URLs for each project
      const processedData = (data || []).map(project => ({
        ...project,
        video_url: mediaService.validateVideoUrl(project.video_url),
        // Ensure boolean fields are boolean
        has_audio: project.has_audio === true,
        has_captions: project.has_captions === true
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
      
      // Validate video URLs for each project
      const processedData = (data || []).map(project => ({
        ...project,
        video_url: mediaService.validateVideoUrl(project.video_url),
        // Ensure boolean fields are boolean
        has_audio: project.has_audio === true,
        has_captions: project.has_captions === true
      }));
      
      return processedData as VideoProject[];
    } catch (error) {
      console.error('Error in getRecentProjects:', error);
      throw error;
    }
  },
  
  async getProjectById(id: string): Promise<VideoProject | null> {
    try {
      // Validate input
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
        // Validate video URL
        data.video_url = mediaService.validateVideoUrl(data.video_url);
        // Ensure boolean fields are boolean
        data.has_audio = data.has_audio === true;
        data.has_captions = data.has_captions === true;
      }
      
      return data as VideoProject;
    } catch (error) {
      console.error('Error in getProjectById:', error);
      throw error;
    }
  },
  
  async createProject(project: Omit<VideoProject, 'id' | 'created_at' | 'updated_at'>): Promise<VideoProject | null> {
    try {
      // Validate required fields
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
      
      // Ensure default values for new columns and proper data types
      const projectWithDefaults = {
        ...project,
        has_audio: project.has_audio === true,
        has_captions: project.has_captions === true,
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
      // Validate project ID
      if (!id) {
        console.error("Missing project ID for update");
        throw new Error("Missing project ID");
      }
      
      // Ensure boolean values are stored as booleans
      const sanitizedUpdates = {
        ...updates,
        has_audio: updates.has_audio === true || updates.has_audio === false 
          ? updates.has_audio 
          : undefined,
        has_captions: updates.has_captions === true || updates.has_captions === false 
          ? updates.has_captions 
          : undefined,
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
      
      // If there's a video_url, validate it
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
      // Validate project ID
      if (!id) {
        console.error("Missing project ID for deletion");
        throw new Error("Missing project ID");
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
    } catch (error) {
      console.error('Error in deleteProject:', error);
      throw error;
    }
  }
};
