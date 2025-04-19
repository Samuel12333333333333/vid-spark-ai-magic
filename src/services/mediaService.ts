
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

  async generateScriptForScenes(scenes: any[]): Promise<string> {
    try {
      // Use the scenes' descriptions to generate a coherent narration script
      const sceneDescriptions = scenes.map(scene => scene.description || scene.scene).join(". ");
      
      console.log("Generating narration script for scenes:", sceneDescriptions);
      
      const { data, error } = await supabase.functions.invoke('generate-scenes', {
        body: { prompt: `Create a short, emotional narration for these scenes: ${sceneDescriptions}`, type: "narration" }
      });
      
      if (error) {
        console.error('Error generating narration script:', error);
        throw error;
      }
      
      if (!data || !data.narration) {
        console.warn('No narration returned from generate-scenes function');
        return sceneDescriptions;
      }
      
      console.log("Generated narration script:", data.narration);
      return data.narration;
    } catch (error) {
      console.error('Error generating script for scenes:', error);
      // Use scene descriptions as fallback
      return scenes.map(scene => scene.description || scene.scene).join(". ");
    }
  },

  async generateAudio(script: string, voiceId: string, userId: string, projectId: string, scenes?: any[]): Promise<{audioBase64: string, narrationScript: string}> {
    try {
      console.log(`Generating audio with voice ${voiceId} for project ${projectId}`);
      console.log(`Script provided: "${script || "No script provided - will generate from scenes"}"`);
      
      let finalScript = script;
      
      // If no script is provided but scenes are available, generate a script
      if ((!finalScript || finalScript.trim() === "") && scenes && scenes.length > 0) {
        try {
          console.log("No script provided, generating from scenes...");
          finalScript = await this.generateScriptForScenes(scenes);
          console.log(`Generated script from scenes: "${finalScript}"`);
        } catch (scriptError) {
          console.error("Error generating script from scenes:", scriptError);
          // Create a simple fallback script
          finalScript = "Experience the beauty and wonder of this moment.";
        }
      }
      
      // Ensure we have a valid script
      if (!finalScript || finalScript.trim() === "") {
        finalScript = "Experience the beauty and wonder of this moment.";
        console.log("Using fallback script:", finalScript);
      }
      
      console.log(`Calling generate-audio function with script: "${finalScript}" and voiceId: ${voiceId}`);
      
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: { 
          script: finalScript, 
          voiceId, 
          userId, 
          projectId,
          scenes: scenes || []
        }
      });
      
      if (error) {
        console.error('Error generating audio:', error);
        
        // Log detailed error information
        if (error.message) {
          console.error('Error message:', error.message);
        }
        
        if (error.details) {
          console.error('Error details:', error.details);
        }
        
        if (error.stack) {
          console.error('Error stack:', error.stack);
        }
        
        throw new Error(`Failed to generate audio: ${error.message || error}`);
      }
      
      if (!data) {
        console.error('No data returned from generate-audio function');
        throw new Error('No data received from audio generation service');
      }
      
      if (!data.audioBase64) {
        console.error('No audio data returned from generate-audio function');
        
        // If we have an error message in the response, use it
        if (data.error) {
          throw new Error(`Audio generation failed: ${data.error}`);
        }
        
        throw new Error('Failed to generate audio content');
      }
      
      // Check that we actually received valid base64 data
      if (data.audioBase64.length < 100) {
        console.error('Received suspicious audio data from generate-audio function, length too short:', data.audioBase64.length);
        throw new Error('Received invalid audio data from service');
      }
      
      // Try to validate the base64 string briefly
      try {
        const testBytes = atob(data.audioBase64.substring(0, 100));
        if (testBytes.length < 10) {
          throw new Error('Invalid base64 data');
        }
      } catch (e) {
        console.error('Invalid base64 audio data received:', e);
        throw new Error('Failed to decode audio data from service');
      }
      
      console.log("Audio generation successful - audioBase64 length:", data.audioBase64.length);
      console.log("Narration script:", data.narrationScript || finalScript);
      
      return {
        audioBase64: data.audioBase64,
        narrationScript: data.narrationScript || finalScript
      };
    } catch (error) {
      console.error('Error in generateAudio:', error);
      throw error;
    }
  },

  async renderVideo(scenes: any[], userId: string, projectId: string, audioBase64?: string, includeCaptions: boolean = true, narrationScript?: string): Promise<string> {
    try {
      console.log(`Rendering video for project ${projectId} with ${scenes.length} scenes`);
      console.log(`Audio provided: ${!!audioBase64}, Include captions: ${includeCaptions}`);
      console.log(`Narration script: "${narrationScript || 'Not provided'}"`);
      
      if (audioBase64) {
        // Log audio data length for debugging
        console.log(`Audio base64 data length: ${audioBase64.length}`);
        
        // Quick validation of audio data
        if (audioBase64.length < 100) {
          console.error('Audio data appears invalid (too short)');
          throw new Error('Invalid audio data provided for video rendering');
        }
      }
      
      const { data, error } = await supabase.functions.invoke('render-video', {
        body: { 
          scenes, 
          userId, 
          projectId, 
          audioBase64, 
          includeCaptions, 
          narrationScript 
        }
      });
      
      if (error) {
        console.error('Error rendering video:', error);
        throw error;
      }
      
      if (!data || !data.renderId) {
        console.error('No render ID returned from render-video function');
        throw new Error('Failed to start video rendering process');
      }
      
      console.log("Render started with ID:", data.renderId);
      
      return data.renderId;
    } catch (error) {
      console.error('Error in renderVideo:', error);
      throw error;
    }
  },
  
  async checkRenderStatus(renderId: string): Promise<RenderStatus> {
    try {
      console.log(`Checking render status for ID: ${renderId}`);
      
      const { data, error } = await supabase.functions.invoke('check-render-status', {
        body: { renderId }
      });
      
      if (error) {
        console.error('Error checking render status:', error);
        throw error;
      }
      
      console.log(`Render status: ${data.status}, URL: ${data.url || 'not ready'}`);
      
      return {
        status: data.status,
        url: data.url
      };
    } catch (error) {
      console.error('Error in checkRenderStatus:', error);
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
