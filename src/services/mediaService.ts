
import { supabase } from "@/integrations/supabase/client";
import { SceneBreakdown } from "@/services/aiService"; // Import the SceneBreakdown type

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
  isMock?: boolean;
  isFallback?: boolean;
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

  async generateAudio(script: string, voiceId: string, userId: string, projectId: string, scenes?: any[]): Promise<{audioBase64: string, narrationScript: string, audioUrl?: string}> {
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
          finalScript = "Journey with us through this visual story.";
          console.log("Using fallback script:", finalScript);
        }
      }
      
      // Ensure we have a valid script
      if (!finalScript || finalScript.trim() === "") {
        finalScript = "Journey with us through this visual story.";
        console.log("Using default fallback script:", finalScript);
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
          projectId,
          scenes: scenes || [] // Include scenes as fallback for generation
        }
      });
      
      if (error) {
        console.error("Error generating audio:", error);
        throw error;
      }
      
      if (!data || !data.audioBase64) {
        if (data?.error) {
          console.error("Audio generation returned error:", data.error);
          throw new Error(`Audio generation failed: ${data.error}`);
        } else {
          console.error("No audio data returned from generate-audio function");
          throw new Error("No audio data returned from generate-audio function");
        }
      }
      
      console.log("Audio generation successful - audioBase64 length:", data.audioBase64.length);
      console.log("Narration script used:", data.narrationScript || finalScript);
      
      // Create a blob URL from the base64 audio for playback in browser
      const audioBlob = this.base64ToBlob(data.audioBase64, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log("Created blob URL for audio playback:", audioUrl);
      
      return {
        audioBase64: data.audioBase64,
        narrationScript: data.narrationScript || finalScript,
        audioUrl
      };
    } catch (error) {
      console.error('Error in generateAudio:', error);
      throw error;
    }
  },
  
  // Helper to convert base64 to Blob
  base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
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
    
    return new Blob(byteArrays, { type: mimeType });
  },

  // Create a publicly accessible URL for audio
  async uploadAudioForShotstack(audioBase64: string, userId: string, projectId: string): Promise<string> {
    try {
      console.log(`Uploading audio for project ${projectId}`);
      
      if (!audioBase64 || audioBase64.length < 100) {
        throw new Error("Invalid audio data provided");
      }
      
      // Create a blob from the base64 audio
      const audioBlob = this.base64ToBlob(audioBase64, 'audio/mp3');
      
      // Generate a unique filename for this audio
      const timestamp = new Date().getTime();
      const filename = `${userId}/${projectId}/audio-${timestamp}.mp3`;
      
      console.log(`Uploading audio file as ${filename}`);
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filename, audioBlob, {
          contentType: 'audio/mp3',
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error("Error uploading audio to storage:", error);
        throw error;
      }
      
      // Get the public URL for the uploaded audio
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filename);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error("Failed to get public URL for uploaded audio");
      }
      
      console.log(`Audio uploaded successfully. Public URL: ${urlData.publicUrl}`);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading audio for Shotstack:", error);
      throw error;
    }
  },
  
  // Generate a captions file (VTT) from narration text
  async generateCaptionsFile(narrationScript: string, userId: string, projectId: string): Promise<string> {
    try {
      console.log(`Generating captions file for project ${projectId}`);
      
      if (!narrationScript || narrationScript.trim() === "") {
        throw new Error("No narration script provided for captions");
      }
      
      // Split the narration into caption segments
      const captionSegments = this.splitNarrationIntoChunks(narrationScript);
      
      // Create a WebVTT format caption file
      let vttContent = "WEBVTT\n\n";
      
      // Calculate approximate timing (rough estimate - 1 caption every 3 seconds)
      captionSegments.forEach((segment, index) => {
        const startTime = index * 3;
        const endTime = startTime + 3;
        
        // Format time as HH:MM:SS.mmm
        const formatTime = (seconds: number) => {
          const hrs = Math.floor(seconds / 3600);
          const mins = Math.floor((seconds % 3600) / 60);
          const secs = Math.floor(seconds % 60);
          const ms = Math.floor((seconds % 1) * 1000);
          return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
        };
        
        vttContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n${segment}\n\n`;
      });
      
      // Generate a unique filename for this caption file
      const timestamp = new Date().getTime();
      const filename = `${userId}/${projectId}/captions-${timestamp}.vtt`;
      
      console.log(`Uploading captions file as ${filename}`);
      
      // Create a blob from the VTT content
      const vttBlob = new Blob([vttContent], { type: 'text/vtt' });
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filename, vttBlob, {
          contentType: 'text/vtt',
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error("Error uploading captions to storage:", error);
        throw error;
      }
      
      // Get the public URL for the uploaded captions
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filename);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error("Failed to get public URL for uploaded captions");
      }
      
      console.log(`Captions uploaded successfully. Public URL: ${urlData.publicUrl}`);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error generating captions file:", error);
      throw error;
    }
  },

  async renderVideo(
    scenes: (SceneBreakdown & { videoUrl: string })[], 
    userId: string, 
    projectId: string,
    audioBase64?: string,
    includeCaptions?: boolean,
    narrationScript?: string
  ): Promise<string> {
    try {
      console.log(`Rendering video for project ${projectId} with ${scenes.length} scenes`);
      
      // Validate scenes for renderability
      const invalidScenes = scenes.filter(scene => !scene.videoUrl);
      if (invalidScenes.length > 0) {
        console.error(`Found ${invalidScenes.length} scenes missing video URLs`);
        throw new Error(`Some scenes are missing video URLs (${invalidScenes.length} of ${scenes.length})`);
      }
      
      let audioUrl;
      let captionsFile;
      
      // If audio is provided, upload it for Shotstack to access
      if (audioBase64 && audioBase64.length > 100) {
        try {
          console.log("Uploading audio for Shotstack...");
          audioUrl = await this.uploadAudioForShotstack(audioBase64, userId, projectId);
          console.log(`Audio uploaded successfully: ${audioUrl}`);
        } catch (audioError) {
          console.error("Error uploading audio, continuing without audio:", audioError);
        }
      }
      
      // If captions are requested and we have a narration script, generate captions file
      if (includeCaptions && narrationScript) {
        try {
          console.log("Generating captions file...");
          captionsFile = await this.generateCaptionsFile(narrationScript, userId, projectId);
          console.log(`Captions file generated successfully: ${captionsFile}`);
        } catch (captionsError) {
          console.error("Error generating captions, continuing without captions:", captionsError);
        }
      }
      
      // Now call the render-video function with all available assets
      const { data, error } = await supabase.functions.invoke("render-video", {
        body: {
          scenes,
          userId,
          projectId,
          audioBase64,
          includeCaptions,
          narrationScript,
          has_audio: !!audioBase64 || !!audioUrl,
          has_captions: !!includeCaptions || !!captionsFile,
          audioUrl,
          captionsFile
        }
      });
      
      if (error) {
        console.error("Error rendering video:", error);
        throw error;
      }
      
      if (!data || !data.renderId) {
        console.error("Invalid response from render-video function:", data);
        throw new Error("Invalid response from render-video function");
      }
      
      console.log(`Successfully obtained render ID: ${data.renderId}`);
      return data.renderId;
    } catch (error) {
      console.error("Error in renderVideo:", error);
      throw error;
    }
  },
  
  async checkRenderStatus(renderId: string, projectId?: string): Promise<RenderStatus> {
    try {
      console.log(`Checking render status for: ${renderId}, project: ${projectId || 'unknown'}`);
      
      const { data, error } = await supabase.functions.invoke("check-render-status", {
        body: { renderId, projectId }
      });
      
      if (error) {
        console.error("Error checking render status:", error);
        throw error;
      }
      
      console.log(`Render status for ${renderId}:`, data);
      return data;
    } catch (error) {
      console.error("Error in checkRenderStatus:", error);
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
  },

  // Add a method to safely split narrative text into chunks for captions
  splitNarrationIntoChunks(narration: string, maxChunkLength: number = 60): string[] {
    if (!narration || typeof narration !== 'string') {
      console.warn("Invalid narration provided to splitNarrationIntoChunks");
      return [""];
    }
    
    // First split by sentences
    const sentences = narration
      .replace(/([.!?])\s*(?=[A-Z])/g, "$1|")
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (sentences.length === 0) {
      return [""];
    }
    
    // Then ensure no sentence is too long by splitting further if needed
    const chunks: string[] = [];
    
    for (const sentence of sentences) {
      if (sentence.length <= maxChunkLength) {
        chunks.push(sentence);
      } else {
        // If a sentence is too long, split it into chunks
        let remainingSentence = sentence;
        while (remainingSentence.length > 0) {
          // Find a good split point (ideally at a comma, space, or other natural break)
          let splitPoint = maxChunkLength;
          
          if (remainingSentence.length > maxChunkLength) {
            // Look for a good break point within the last 20 characters of the chunk
            const searchArea = remainingSentence.substring(Math.max(0, maxChunkLength - 20), maxChunkLength);
            const lastComma = searchArea.lastIndexOf(',');
            const lastSpace = searchArea.lastIndexOf(' ');
            
            if (lastComma > -1) {
              splitPoint = maxChunkLength - (searchArea.length - lastComma - 1);
            } else if (lastSpace > -1) {
              splitPoint = maxChunkLength - (searchArea.length - lastSpace - 1);
            }
          }
          
          // Add the chunk and continue with the remainder
          chunks.push(remainingSentence.substring(0, splitPoint).trim());
          remainingSentence = remainingSentence.substring(splitPoint).trim();
        }
      }
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }
};
