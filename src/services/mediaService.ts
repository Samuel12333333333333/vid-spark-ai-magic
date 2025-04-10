
import { supabase } from "@/integrations/supabase/client";

export interface VideoClip {
  id: string;
  url: string;
  preview: string;
  duration: number;
  width: number;
  height: number;
}

export const mediaService = {
  async searchVideos(keywords: string[]): Promise<VideoClip[]> {
    try {
      const { data, error } = await supabase.functions.invoke('search-videos', {
        body: { keywords }
      });
      
      if (error) throw error;
      
      return data.videos;
    } catch (error) {
      console.error('Error searching videos:', error);
      throw error;
    }
  },
  
  async renderVideo(scenes: any[], userId: string, projectId: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('render-video', {
        body: { 
          scenes,
          userId,
          projectId
        }
      });
      
      if (error) throw error;
      
      return data.renderId;
    } catch (error) {
      console.error('Error rendering video:', error);
      throw error;
    }
  },
  
  async checkRenderStatus(renderId: string): Promise<{ status: string; url?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('check-render-status', {
        body: { renderId }
      });
      
      if (error) throw error;
      
      return {
        status: data.status,
        url: data.url
      };
    } catch (error) {
      console.error('Error checking render status:', error);
      throw error;
    }
  }
};
