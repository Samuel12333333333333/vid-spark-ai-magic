
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
      // Ensure keywords is an array before proceeding
      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        console.warn("Empty or invalid keywords provided to searchVideos");
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
      
      if (!data || !Array.isArray(data.videos)) {
        console.warn('No videos returned from search-videos function or invalid response format');
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
      // Validate scenes input
      if (!Array.isArray(scenes) || scenes.length === 0) {
        console.warn("Invalid or empty scenes provided to generateScriptForScenes");
        return "Journey with us through this visual story.";
      }
      
      // Use the scenes' descriptions to generate a coherent narration script
      const sceneDescriptions = scenes
        .map(scene => (scene?.description || scene?.scene || ""))
        .filter(desc => desc.trim() !== "")
        .join(". ");
      
      if (!sceneDescriptions || sceneDescriptions.trim() === "") {
        console.warn("No valid scene descriptions found");
        return "Journey with us through this visual story.";
      }
      
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
        return "Journey with us through this visual story.";
      }
      
      console.log("Generated narration script:", data.narration);
      return data.narration;
    } catch (error) {
      console.error('Error generating script for scenes:', error);
      // Use a short, generic fallback narration
      return "Journey with us through this visual story.";
    }
  },

  async generateAudio(script: string, voiceId: string, userId: string, projectId: string, scenes?: any[]): Promise<{audioBase64: string, narrationScript: string}> {
    try {
      console.log(`Generating audio with voice ${voiceId} for project ${projectId}`);
      
      // Log the important parameters
      const hasScript = !!script && script.trim() !== "";
      console.log({
        scriptProvided: hasScript ? "Yes" : "No script provided - will generate from scenes",
        scriptLength: script?.length || 0,
        voiceId,
        userId,
        projectId,
        scenesProvided: !!scenes && Array.isArray(scenes) && scenes.length > 0,
        scenesCount: Array.isArray(scenes) ? scenes.length : 0
      });
      
      let finalScript = script;
      
      // If no script is provided but scenes are available, generate a script
      if ((!finalScript || finalScript.trim() === "") && Array.isArray(scenes) && scenes.length > 0) {
        try {
          console.log("No script provided, generating from scenes...");
          finalScript = await this.generateScriptForScenes(scenes);
          console.log(`Generated script from scenes: "${finalScript}"`);
        } catch (scriptError) {
          console.error("Error generating script from scenes:", scriptError);
          throw new Error("Failed to generate narration script");
        }
      }
      
      // Ensure we have a valid script
      if (!finalScript || finalScript.trim() === "") {
        throw new Error("No valid script provided or generated");
      }
      
      // Sanitize the script - important for ElevenLabs
      finalScript = finalScript
        .replace(/\.\.+/g, '.') // Replace multiple periods with a single one
        .replace(/\s+/g, ' ')   // Replace multiple spaces with a single one
        .trim();               // Trim whitespace
      
      // Enforce script length limit for ElevenLabs
      if (finalScript.length > 5000) {
        console.warn("Script exceeds ElevenLabs character limit, truncating");
        finalScript = finalScript.substring(0, 4950) + "...";
      }
      
      console.log(`Calling generate-audio function with script: "${finalScript}" and voiceId: ${voiceId}`);
      
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: { 
          script: finalScript, 
          voiceId, 
          userId, 
          projectId
        }
      });
      
      if (error) {
        console.error('Error generating audio:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No data returned from generate-audio function');
        throw new Error('Failed to generate audio content');
      }
      
      if (!data.audioBase64) {
        if (data.error) {
          console.error('Audio generation error:', data.error);
          throw new Error(`Audio generation failed: ${data.error}`);
        }
        console.error('No audio data returned from generate-audio function');
        throw new Error('Failed to generate audio content');
      }
      
      // Verify that audioBase64 data looks valid
      if (data.audioBase64.length < 100 || !data.audioBase64.match(/^[A-Za-z0-9+/=]+$/)) {
        console.error('Invalid audio data returned from generate-audio function');
        throw new Error('Invalid audio data received');
      }
      
      console.log("Audio generation successful - audioBase64 length:", data.audioBase64.length);
      console.log("Narration script used:", data.narrationScript || finalScript);
      
      return {
        audioBase64: data.audioBase64,
        narrationScript: data.narrationScript || finalScript
      };
    } catch (error) {
      console.error('Error in generateAudio:', error);
      throw error;
    }
  },

  async renderVideo(
    scenes: any[], 
    userId: string, 
    projectId: string, 
    audioBase64?: string, 
    includeCaptions: boolean = true, 
    narrationScript?: string
  ): Promise<string> {
    try {
      console.log(`Rendering video for project ${projectId} with ${scenes?.length || 0} scenes`);
      console.log(`Audio provided: ${!!audioBase64 ? 'Yes, length: ' + audioBase64?.length : 'No'}`);
      console.log(`Include captions: ${includeCaptions}`);
      console.log(`Narration script: "${narrationScript || 'Not provided'}"`);
      
      // Make sure we have valid scenes
      if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
        throw new Error("No valid scenes provided for video rendering");
      }
      
      // Check that scenes have video URLs
      const invalidScenes = scenes.filter(scene => !scene.videoUrl);
      if (invalidScenes.length > 0) {
        console.error(`Missing video URLs in ${invalidScenes.length} scenes`);
        
        // If more than half the scenes are invalid, fail
        if (invalidScenes.length > scenes.length / 2) {
          throw new Error(`Too many scenes (${invalidScenes.length} out of ${scenes.length}) are missing video URLs`);
        }
        
        // Otherwise, filter them out
        scenes = scenes.filter(scene => scene.videoUrl);
        console.log(`Proceeding with ${scenes.length} valid scenes after filtering`);
      }
      
      // Validate audio data if provided
      if (audioBase64) {
        if (audioBase64.length < 100 || !audioBase64.match(/^[A-Za-z0-9+/=]+$/)) {
          console.error('Invalid audio data, will proceed without audio');
          audioBase64 = undefined;
        } else {
          // Log audio data length for debugging
          console.log(`Audio base64 data length: ${audioBase64.length}`);
        }
      }
      
      // Sanitize narration script if provided
      if (narrationScript) {
        narrationScript = narrationScript
          .replace(/\.\.+/g, '.') // Replace multiple periods with a single one
          .replace(/\s+/g, ' ')   // Replace multiple spaces with a single one
          .trim();                // Trim whitespace
      }
      
      // Prepare the payload - ensure all fields are properly defined
      const payload = { 
        scenes, 
        userId, 
        projectId, 
        audioBase64, 
        includeCaptions: !!includeCaptions, // Ensure boolean
        narrationScript: narrationScript || "" // Ensure string 
      };
      
      // Call the edge function with detailed logging
      console.log("Sending request to render-video function with payload structure:", {
        scenesCount: scenes.length,
        hasAudio: !!audioBase64,
        audioLength: audioBase64?.length || 0,
        includesCaptions: !!includeCaptions,
        hasNarrationScript: !!narrationScript,
        narrationScriptLength: narrationScript?.length || 0
      });
      
      const { data, error } = await supabase.functions.invoke('render-video', {
        body: payload
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
      if (!renderId) {
        console.error("Invalid render ID provided to checkRenderStatus");
        return { status: 'failed' };
      }
      
      console.log(`Checking render status for ID: ${renderId}`);
      
      const { data, error } = await supabase.functions.invoke('check-render-status', {
        body: { renderId }
      });
      
      if (error) {
        console.error('Error checking render status:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No data returned from check-render-status function');
        return { status: 'failed' };
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
