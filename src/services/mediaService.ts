
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
      
      // Add a retry mechanism for audio generation
      let retries = 0;
      const maxRetries = 2;
      let audioData = null;
      let audioError = null;
      
      while (retries <= maxRetries && !audioData) {
        try {
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
            console.error(`Audio generation attempt ${retries + 1} failed:`, error);
            audioError = error;
            retries++;
            if (retries <= maxRetries) {
              console.log(`Retrying audio generation (${retries}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
            continue;
          }
          
          if (!data) {
            console.error(`Audio generation attempt ${retries + 1} returned no data`);
            audioError = new Error('No data returned from generate-audio function');
            retries++;
            if (retries <= maxRetries) {
              console.log(`Retrying audio generation (${retries}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
            continue;
          }
          
          if (!data.audioBase64) {
            if (data.error) {
              console.error(`Audio generation attempt ${retries + 1} returned error:`, data.error);
              audioError = new Error(`Audio generation failed: ${data.error}`);
            } else {
              console.error(`Audio generation attempt ${retries + 1} returned no audio data`);
              audioError = new Error('No audio data returned from generate-audio function');
            }
            retries++;
            if (retries <= maxRetries) {
              console.log(`Retrying audio generation (${retries}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
            continue;
          }
          
          // Verify that audioBase64 data looks valid
          if (data.audioBase64.length < 100 || !data.audioBase64.match(/^[A-Za-z0-9+/=]+$/)) {
            console.error(`Audio generation attempt ${retries + 1} returned invalid audio data`);
            audioError = new Error('Invalid audio data received');
            retries++;
            if (retries <= maxRetries) {
              console.log(`Retrying audio generation (${retries}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            }
            continue;
          }
          
          // Valid audio found
          audioData = data;
          console.log("Audio generation successful - audioBase64 length:", data.audioBase64.length);
          console.log("Narration script used:", data.narrationScript || finalScript);
          break;
        } catch (attemptError) {
          console.error(`Error in audio generation attempt ${retries + 1}:`, attemptError);
          audioError = attemptError;
          retries++;
          if (retries <= maxRetries) {
            console.log(`Retrying audio generation (${retries}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
      }
      
      // If we couldn't generate audio after all retries, throw the last error
      if (!audioData) {
        throw audioError || new Error('Failed to generate audio after multiple attempts');
      }
      
      return {
        audioBase64: audioData.audioBase64,
        narrationScript: audioData.narrationScript || finalScript
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
      // Validate input parameters
      if (!scenes || !Array.isArray(scenes)) {
        console.error("Invalid scenes parameter: scenes must be an array");
        throw new Error("Invalid scenes parameter");
      }
      
      if (scenes.length === 0) {
        console.error("Empty scenes array: at least one scene is required");
        throw new Error("Empty scenes array");
      }
      
      if (!userId) {
        console.error("Missing userId parameter");
        throw new Error("Missing userId parameter");
      }
      
      if (!projectId) {
        console.error("Missing projectId parameter");
        throw new Error("Missing projectId parameter");
      }
      
      console.log(`Rendering video for project ${projectId} with ${scenes.length} scenes`);
      console.log(`Audio provided: ${!!audioBase64 ? 'Yes, length: ' + audioBase64.length : 'No'}`);
      console.log(`Include captions: ${includeCaptions}`);
      console.log(`Narration script: "${narrationScript || 'Not provided'}"`);
      
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
      let hasAudio = false;
      if (audioBase64) {
        if (audioBase64.length < 100 || !audioBase64.match(/^[A-Za-z0-9+/=]+$/)) {
          console.error('Invalid audio data, will proceed without audio');
          audioBase64 = undefined;
        } else {
          // Audio data is valid
          hasAudio = true;
          console.log(`Audio base64 data length: ${audioBase64.length}`);
        }
      }
      
      // Sanitize narration script if provided
      let finalNarrationScript = narrationScript;
      if (!finalNarrationScript || finalNarrationScript.trim() === '') {
        // Generate a script from scene descriptions as fallback
        finalNarrationScript = scenes
          .map(scene => scene.description || scene.scene || "")
          .filter(text => text.trim() !== "")
          .join(". ");
        
        if (finalNarrationScript) {
          console.log(`Generated fallback narration from scenes: ${finalNarrationScript.substring(0, 100)}...`);
        } else {
          finalNarrationScript = "Experience this visual journey with us.";
          console.log("Using default narration:", finalNarrationScript);
        }
      }
      
      // Clean up the narration script
      finalNarrationScript = finalNarrationScript
        .replace(/\.\.+/g, '.') // Replace multiple periods with a single one
        .replace(/\s+/g, ' ')   // Replace multiple spaces with a single one
        .trim();                // Trim whitespace
      
      // Prepare the payload with explicit boolean values
      const payload = { 
        scenes, 
        userId, 
        projectId, 
        audioBase64, 
        includeCaptions: includeCaptions === true, 
        narrationScript: finalNarrationScript,
        // Add explicit flags for better debugging
        has_audio: hasAudio,
        has_captions: includeCaptions === true
      };
      
      // Call the edge function with detailed logging
      console.log("Sending request to render-video function with payload structure:", {
        scenesCount: scenes.length,
        hasAudio: hasAudio,
        audioLength: audioBase64?.length || 0,
        includesCaptions: includeCaptions === true,
        hasNarrationScript: !!finalNarrationScript,
        narrationScriptLength: finalNarrationScript?.length || 0
      });
      
      // Add retry mechanism for video rendering
      let retries = 0;
      const maxRetries = 2;
      let renderData = null;
      let renderError = null;
      
      while (retries <= maxRetries && !renderData) {
        try {
          const { data, error } = await supabase.functions.invoke('render-video', {
            body: payload
          });
          
          if (error) {
            console.error(`Video render attempt ${retries + 1} failed:`, error);
            renderError = error;
            retries++;
            if (retries <= maxRetries) {
              console.log(`Retrying video render (${retries}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
              continue;
            }
            throw error;
          }
          
          if (!data || !data.renderId) {
            console.error(`Video render attempt ${retries + 1} returned no render ID`);
            renderError = new Error('Failed to start video rendering process');
            retries++;
            if (retries <= maxRetries) {
              console.log(`Retrying video render (${retries}/${maxRetries})...`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
              continue;
            }
            throw new Error('Failed to start video rendering process');
          }
          
          renderData = data;
          console.log("Render started with ID:", data.renderId);
          break;
        } catch (attemptError) {
          console.error(`Error in video render attempt ${retries + 1}:`, attemptError);
          renderError = attemptError;
          retries++;
          if (retries <= maxRetries) {
            console.log(`Retrying video render (${retries}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        }
      }
      
      // If we couldn't render after all retries, throw the last error
      if (!renderData) {
        throw renderError || new Error('Failed to render video after multiple attempts');
      }
      
      // Store metadata about the render for debugging purposes
      try {
        const { error: updateError } = await supabase
          .from("video_projects")
          .update({
            has_audio: hasAudio,
            has_captions: includeCaptions === true,
            narration_script: finalNarrationScript
          })
          .eq("id", projectId);
          
        if (updateError) {
          console.error("Error updating video project with metadata:", updateError);
        } else {
          console.log("Successfully stored render metadata in project");
        }
      } catch (metadataError) {
        console.error("Error storing render metadata:", metadataError);
      }
      
      return renderData.renderId;
    } catch (error) {
      console.error('Error in renderVideo:', error);
      
      // Update project status to failed
      try {
        const { error: updateError } = await supabase
          .from("video_projects")
          .update({
            status: "failed",
            render_id: null
          })
          .eq("id", projectId);
          
        if (updateError) {
          console.error("Error updating project status to failed:", updateError);
        }
      } catch (statusError) {
        console.error("Error updating project status:", statusError);
      }
      
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
      return { status: 'failed' };
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
