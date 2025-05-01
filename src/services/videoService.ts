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
        thumbnail_url: project.thumbnail_url || project.video_url || '/placeholder.svg'
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
      
      // Validate video URLs for each project and ensure thumbnail URLs
      const processedData = (data || []).map(project => ({
        ...project,
        video_url: mediaService.validateVideoUrl(project.video_url),
        thumbnail_url: project.thumbnail_url || project.video_url || '/placeholder.svg'
      }));
      
      return processedData as VideoProject[];
    } catch (error) {
      console.error('Error in getRecentProjects:', error);
      throw error;
    }
  },
  
  async getProjectById(id: string): Promise<VideoProject | null> {
    try {
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
        // Ensure thumbnail URL, fallback to video URL if available
        data.thumbnail_url = data.thumbnail_url || data.video_url || '/placeholder.svg';
      }
      
      return data as VideoProject;
    } catch (error) {
      console.error('Error in getProjectById:', error);
      throw error;
    }
  },
  
  async createProject(project: Omit<VideoProject, 'id' | 'created_at' | 'updated_at'>): Promise<VideoProject | null> {
    try {
      const { data, error } = await supabase
        .from('video_projects')
        .insert(project)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating video project:', error);
        throw error;
      }
      
      return data as VideoProject;
    } catch (error) {
      console.error('Error in createProject:', error);
      throw error;
    }
  },
  
  async updateProject(id: string, updates: Partial<VideoProject>): Promise<void> {
    try {
      // If there's a video_url, validate it
      if (updates.video_url) {
        updates.video_url = mediaService.validateVideoUrl(updates.video_url);
      }
      
      const { error } = await supabase
        .from('video_projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) {
        console.error(`Error updating video project with id ${id}:`, error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateProject:', error);
      throw error;
    }
  },
  
  async deleteProject(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('video_projects')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error(`Error deleting video project with id ${id}:`, error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteProject:', error);
      throw error;
    }
  },
  
  // Poll for video render completion
  async pollRenderStatus(projectId: string, renderId: string): Promise<void> {
    try {
      const checkStatus = async () => {
        try {
          const result = await mediaService.checkRenderStatus(renderId);
          
          if (result.status === "done" && result.url) {
            // The database update now happens in the edge function
            // We only need to update the project status locally
            console.log(`Video render completed for project ${projectId}`);
            return true;
          } else if (result.status === "failed") {
            await this.updateProject(projectId, { status: "failed" });
            console.error(`Video render failed for project ${projectId}`);
            return true;
          }
          
          // Still processing
          console.log(`Video render status for project ${projectId}: ${result.status}`);
          return false;
        } catch (error) {
          console.error(`Error checking render status for project ${projectId}:`, error);
          await this.updateProject(projectId, { status: "failed" });
          return true; // Stop polling on error
        }
      };
      
      // Initial delay before first check
      setTimeout(async () => {
        let completed = false;
        let attempts = 0;
        const maxAttempts = 30; // Stop after ~5 minutes (30 attempts * 10 seconds)
        
        while (!completed && attempts < maxAttempts) {
          completed = await checkStatus();
          
          if (!completed) {
            // Wait 10 seconds before checking again
            await new Promise(resolve => setTimeout(resolve, 10000));
            attempts++;
          }
        }
        
        // If we've reached max attempts without completion
        if (attempts >= maxAttempts && !completed) {
          console.error(`Render timeout for project ${projectId}`);
          await this.updateProject(projectId, { status: "failed" });
        }
      }, 5000);
    } catch (error) {
      console.error(`Error in pollRenderStatus for project ${projectId}:`, error);
      await this.updateProject(projectId, { status: "failed" });
    }
  }
};
