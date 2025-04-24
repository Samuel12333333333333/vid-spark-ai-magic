import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VideoClip {
  id: string;
  url: string;
  image: string;
  width: number;
  height: number;
  duration: number;
  user: {
    name: string;
    url: string;
  };
}

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
}

const availableVoices: VoiceOption[] = [
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    language: "English",
    gender: "female"
  },
  {
    id: "AZnzlk1XvdvUeBnXmlld",
    name: "Adam",
    language: "English",
    gender: "male"
  }
];

export const mediaService = {
  validateVideoUrl(url?: string | null): string | undefined {
    if (!url) return undefined;
    
    try {
      // Ensure URL is valid
      new URL(url);
      return url;
    } catch (error) {
      console.error("Invalid video URL:", url);
      return undefined;
    }
  },
  
  async getVideoCaption(filePath: string): Promise<string | null> {
    try {
      if (!filePath) {
        throw new Error("No caption file path provided");
      }
      
      // Extract bucket and path information
      const pathParts = filePath.split('/');
      const bucketName = pathParts[0];
      const captionPath = pathParts.slice(1).join('/');
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(captionPath);
        
      if (error) {
        console.error("Error downloading caption file:", error);
        throw error;
      }
      
      if (!data) {
        return null;
      }
      
      // Convert blob to text
      const captionText = await data.text();
      return captionText;
    } catch (error) {
      console.error("Error retrieving video caption:", error);
      // Don't show errors to users for captions - they're not critical
      return null;
    }
  },
  
  async getAudioFile(filePath: string): Promise<Blob | null> {
    try {
      if (!filePath) {
        throw new Error("No audio file path provided");
      }
      
      // Extract bucket and path information
      const pathParts = filePath.split('/');
      const bucketName = pathParts[0];
      const audioPath = pathParts.slice(1).join('/');
      
      // Log the request to help with debugging
      console.log(`Requesting audio file from bucket: ${bucketName}, path: ${audioPath}`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(audioPath);
        
      if (error) {
        console.error("Error downloading audio file:", error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Error retrieving audio file:", error);
      toast.error("Failed to load audio file. Please try again later.");
      return null;
    }
  },
  
  async uploadMediaFile(bucketName: string, filePath: string, file: File): Promise<string | null> {
    try {
      if (!file) {
        throw new Error("No file provided for upload");
      }
      
      // Check file size
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error("File size exceeds 50MB limit");
      }
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error("Error uploading media file:", error);
        throw error;
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
        
      return publicUrl;
    } catch (error) {
      console.error("Error in uploadMediaFile:", error);
      
      if (error instanceof Error) {
        toast.error(`Upload failed: ${error.message}`);
      } else {
        toast.error("Failed to upload file. Please try again.");
      }
      
      return null;
    }
  },

  getAvailableVoices(): VoiceOption[] {
    return availableVoices;
  },

  async searchVideos(keywords: string[]): Promise<VideoClip[]> {
    try {
      const { data, error } = await supabase.functions.invoke("search-videos", {
        body: { keywords }
      });

      if (error) {
        console.error("Error searching videos:", error);
        throw error;
      }

      return data.videos || [];
    } catch (error) {
      console.error("Error in searchVideos:", error);
      toast.error("Failed to search for videos. Please try again.");
      return [];
    }
  },

  async generateAudio(
    script: string,
    voiceId: string,
    userId: string,
    projectId: string,
    scenes?: { id: string; scene: string; description: string }[]
  ): Promise<{ audioBase64: string; narrationScript: string }> {
    try {
      const { data, error } = await supabase.functions.invoke("generate-audio", {
        body: { script, voiceId, userId, projectId, scenes }
      });

      if (error) {
        console.error("Error generating audio:", error);
        throw error;
      }

      return {
        audioBase64: data.audioBase64,
        narrationScript: data.narrationScript
      };
    } catch (error) {
      console.error("Error in generateAudio:", error);
      toast.error("Failed to generate audio. Please try again.");
      throw error;
    }
  },

  async renderVideo(
    scenes: any[],
    userId: string,
    projectId: string,
    audioBase64?: string,
    enableCaptions?: boolean,
    narrationScript?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke("render-video", {
        body: {
          scenes,
          userId,
          projectId,
          audioBase64,
          enableCaptions,
          narrationScript
        }
      });

      if (error) {
        console.error("Error rendering video:", error);
        throw error;
      }

      return data.renderId;
    } catch (error) {
      console.error("Error in renderVideo:", error);
      toast.error("Failed to start video rendering. Please try again.");
      throw error;
    }
  },

  async checkRenderStatus(renderId: string): Promise<{ status: string; url?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke("check-render-status", {
        body: { renderId }
      });

      if (error) {
        console.error("Error checking render status:", error);
        throw error;
      }

      return {
        status: data.status,
        url: data.url
      };
    } catch (error) {
      console.error("Error in checkRenderStatus:", error);
      toast.error("Failed to check video render status. Please try again.");
      throw error;
    }
  }
};
