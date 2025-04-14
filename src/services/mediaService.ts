
import { supabase } from "@/integrations/supabase/client";

export interface VideoClip {
  id: string;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    name: string;
    url: string;
  };
}

export interface RenderStatus {
  status: string;
  url?: string;
}

export interface VoiceOption {
  id: string;
  name: string;
}

export const mediaService = {
  validateVideoUrl(url?: string): string | undefined {
    if (!url) return undefined;
    
    // Basic validation for URL format
    try {
      new URL(url);
      return url;
    } catch (e) {
      console.error("Invalid video URL:", url);
      return undefined;
    }
  },
  
  async searchVideos(keywords: string[]): Promise<VideoClip[]> {
    try {
      if (!keywords || keywords.length === 0) {
        console.warn("Empty keywords provided to searchVideos");
        return [];
      }
      
      // Filter out empty keywords
      const filteredKeywords = keywords.filter(k => k && k.trim() !== "");
      
      if (filteredKeywords.length === 0) {
        console.warn("All keywords were empty after filtering");
        return [];
      }
      
      console.log("Searching videos with keywords:", filteredKeywords);
      
      const { data, error } = await supabase.functions.invoke('search-videos', {
        body: { keywords: filteredKeywords }
      });
      
      if (error) {
        console.error('Error searching videos:', error);
        throw error;
      }
      
      if (!data || !data.videos) {
        console.warn('No videos returned from search-videos function');
        return [];
      }
      
      return data.videos;
    } catch (error) {
      console.error('Error in searchVideos:', error);
      // Return empty array instead of throwing to allow the process to continue
      // with other scene videos if possible
      return [];
    }
  },

  async renderVideo(scenes: any[], userId: string, projectId: string, audioBase64?: string, includeCaptions: boolean = false): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('render-video', {
        body: { scenes, userId, projectId, audioBase64, includeCaptions }
      });
      
      if (error) {
        console.error('Error rendering video:', error);
        throw error;
      }
      
      return data.renderId;
    } catch (error) {
      console.error('Error in renderVideo:', error);
      throw error;
    }
  },
  
  async checkRenderStatus(renderId: string): Promise<RenderStatus> {
    try {
      const { data, error } = await supabase.functions.invoke('check-render-status', {
        body: { renderId }
      });
      
      if (error) {
        console.error('Error checking render status:', error);
        throw error;
      }
      
      return {
        status: data.status,
        url: data.url
      };
    } catch (error) {
      console.error('Error in checkRenderStatus:', error);
      throw error;
    }
  },

  async generateAudio(script: string, voiceId: string, userId: string, projectId: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: { script, voiceId, userId, projectId }
      });
      
      if (error) {
        console.error('Error generating audio:', error);
        throw error;
      }
      
      return data.audioBase64;
    } catch (error) {
      console.error('Error in generateAudio:', error);
      throw error;
    }
  },

  getAvailableVoices(): VoiceOption[] {
    return [
      { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel - Warm and conversational" },
      { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi - Strong and confident" },
      { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah - Professional and clear" },
      { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli - Approachable and friendly" },
      { id: "pNInz6obpgDQGcFmaJgB", name: "Adam - Deep and authoritative" },
      { id: "yoZ06aMxZJJ28mfd3POQ", name: "Josh - Warm and engaging" }
    ];
  }
};
