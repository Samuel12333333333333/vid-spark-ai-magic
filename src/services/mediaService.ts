
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
    name: "Domi",
    language: "English",
    gender: "female"
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    language: "English",
    gender: "female"
  },
  {
    id: "MF3mGyEYCl7XYWbV9V6O",
    name: "Elli",
    language: "English",
    gender: "female"
  },
  {
    id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    language: "English",
    gender: "male"
  },
  {
    id: "yoZ06aMxZJJ28mfd3POQ",
    name: "Josh",
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
      toast.info("Generating voiceover...", {
        duration: 10000,
        id: "generating-voiceover"
      });
      
      const { data, error } = await supabase.functions.invoke("generate-audio", {
        body: { script, voiceId, userId, projectId, scenes }
      });

      if (error) {
        console.error("Error generating audio:", error);
        toast.dismiss("generating-voiceover");
        throw error;
      }
      
      toast.dismiss("generating-voiceover");
      toast.success("Voiceover generated successfully!");

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

  async generateCaptions(
    script: string,
    projectId: string
  ): Promise<string | null> {
    try {
      toast.info("Generating captions...", {
        duration: 10000,
        id: "generating-captions"
      });
      
      // Create a WebVTT file from the script
      const vttContent = this.createWebVTT(script);
      
      // Create a blob from the WebVTT content
      const blob = new Blob([vttContent], { type: 'text/vtt' });
      const file = new File([blob], `captions-${projectId}.vtt`, { type: 'text/vtt' });
      
      // Upload the VTT file to Supabase storage
      const captionsUrl = await this.uploadMediaFile('video-assets', `captions/${projectId}.vtt`, file);
      
      toast.dismiss("generating-captions");
      
      if (captionsUrl) {
        toast.success("Captions generated successfully!");
      }
      
      return captionsUrl;
    } catch (error) {
      console.error("Error generating captions:", error);
      toast.error("Failed to generate captions. Please try again.");
      return null;
    }
  },
  
  // Helper method to create WebVTT file from script
  createWebVTT(script: string): string {
    // Basic WebVTT file format
    let vttContent = "WEBVTT\n\n";
    
    // Split the script into sentences
    const sentences = script.split(/[.!?]/).filter(s => s.trim().length > 0);
    
    // Generate cues for each sentence
    // Assuming roughly 15 chars per second for reading speed
    let startTime = 0;
    
    sentences.forEach((sentence, index) => {
      const trimmedSentence = sentence.trim();
      // Calculate duration based on character count (rough estimate)
      const duration = Math.max(2, Math.min(10, trimmedSentence.length / 15));
      
      const startTimeFormatted = this.formatVTTTime(startTime);
      const endTimeFormatted = this.formatVTTTime(startTime + duration);
      
      vttContent += `${index + 1}\n`;
      vttContent += `${startTimeFormatted} --> ${endTimeFormatted}\n`;
      vttContent += `${trimmedSentence}\n\n`;
      
      startTime += duration;
    });
    
    return vttContent;
  },
  
  // Helper to format time for VTT (00:00:00.000)
  formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
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
      // Generate captions if enabled
      let captionsFile = null;
      if (enableCaptions && narrationScript) {
        captionsFile = await this.generateCaptions(narrationScript, projectId);
      }
      
      // Generate audio URL if we have base64 audio
      let audioUrl = null;
      if (audioBase64) {
        // Convert base64 to blob
        const byteCharacters = atob(audioBase64);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, {type: 'audio/mp3'});
        const file = new File([blob], `audio-${projectId}.mp3`, {type: 'audio/mp3'});
        
        // Upload the audio file
        audioUrl = await this.uploadMediaFile('video-assets', `audio/${projectId}.mp3`, file);
      }
      
      toast.info("Starting video render...");
      
      const { data, error } = await supabase.functions.invoke("render-video", {
        body: {
          scenes,
          userId,
          projectId,
          audioBase64,
          audioUrl,
          has_audio: !!audioBase64 || !!audioUrl,
          has_captions: enableCaptions,
          includeCaptions: enableCaptions,
          captionsFile,
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
