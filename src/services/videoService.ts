
import { supabase } from "@/integrations/supabase/client";

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
      
      return (data || []) as VideoProject[];
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
      
      return (data || []) as VideoProject[];
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
      const { error } = await supabase
        .from('video_projects')
        .update(updates)
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
  }
};
