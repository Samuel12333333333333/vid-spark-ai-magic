
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
      console.log("Calling search-videos function with keywords:", keywords);
      
      const { data, error } = await supabase.functions.invoke('search-videos', {
        body: { keywords }
      });
      
      if (error) {
        console.error("Error from search-videos function:", error);
        throw new Error(`Failed to search videos: ${error.message}`);
      }
      
      if (!data) {
        console.error("No data returned from search-videos function");
        throw new Error("No response from video search service");
      }

      if (data.error) {
        console.error("Error in search-videos response:", data.error);
        throw new Error(data.error.details || data.error);
      }
      
      if (!data.videos || !Array.isArray(data.videos)) {
        console.error("Invalid response from search-videos function:", data);
        throw new Error("Invalid response from video search service");
      }
      
      return data.videos;
    } catch (error) {
      console.error('Error searching videos:', error);
      throw error;
    }
  },
  
  async renderVideo(scenes: any[], userId: string, projectId: string): Promise<string> {
    try {
      console.log("Calling render-video function with scenes:", scenes.length);
      
      const { data, error } = await supabase.functions.invoke('render-video', {
        body: { 
          scenes,
          userId,
          projectId
        }
      });
      
      if (error) {
        console.error("Error from render-video function:", error);
        throw new Error(`Failed to render video: ${error.message}`);
      }
      
      if (!data) {
        console.error("No data returned from render-video function");
        throw new Error("No response from video rendering service");
      }

      if (data.error) {
        console.error("Error in render-video response:", data.error);
        throw new Error(data.error.details || data.error);
      }
      
      if (!data.renderId) {
        console.error("Invalid response from render-video function:", data);
        throw new Error("Invalid response from video rendering service");
      }
      
      return data.renderId;
    } catch (error) {
      console.error('Error rendering video:', error);
      throw error;
    }
  },
  
  async checkRenderStatus(renderId: string): Promise<{ status: string; url?: string }> {
    try {
      console.log("Calling check-render-status function for ID:", renderId);
      
      const { data, error } = await supabase.functions.invoke('check-render-status', {
        body: { renderId }
      });
      
      if (error) {
        console.error("Error from check-render-status function:", error);
        throw new Error(`Failed to check render status: ${error.message}`);
      }
      
      if (!data) {
        console.error("No data returned from check-render-status function");
        throw new Error("No response from render status service");
      }

      if (data.error) {
        console.error("Error in check-render-status response:", data.error);
        throw new Error(data.error.details || data.error);
      }
      
      if (!data.status) {
        console.error("Invalid response from check-render-status function:", data);
        throw new Error("Invalid response from render status service");
      }
      
      // Log the video URL for debugging
      if (data.url) {
        console.log("Received video URL:", data.url);
      }
      
      return {
        status: data.status,
        url: data.url
      };
    } catch (error) {
      console.error('Error checking render status:', error);
      throw error;
    }
  },
  
  // Helper method to validate video URLs
  validateVideoUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    
    // Log the URL for debugging
    console.log("Validating video URL:", url);
    
    // Make sure the URL is properly formatted
    try {
      const validatedUrl = new URL(url).toString();
      return validatedUrl;
    } catch (e) {
      console.error("Invalid video URL:", url, e);
      return undefined;
    }
  }
};
