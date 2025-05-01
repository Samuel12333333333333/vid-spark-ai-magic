import { supabase } from "@/integrations/supabase/client";
import { aiService, SceneBreakdown } from "@/services/aiService";
import { toast } from "sonner";
import { mediaService } from "@/services/mediaService";
import { renderNotifications } from "@/services/video/renderNotifications";
import { VideoProjectUpdate } from "@/services/video/types";

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
  has_audio?: boolean;
  has_captions?: boolean;
  narration_script?: string;
  scenes?: any[]; 
  audio_data?: string;
  error_message?: string;
  audio_url?: string;
}

interface VideoGenerationParams {
  prompt: string;
  style: string;
  format?: string;
  userId: string;
  brandKit?: {
    primaryColor: string;
    secondaryColor: string;
    font: string;
  };
  mediaUrls?: string[];
  useStockMedia?: boolean;
  voiceSettings?: {
    voiceId: string;
    script: string;
  };
  modelVersion?: string;
}

interface VideoGenerationResult {
  success: boolean;
  videoId?: string;
  error?: string;
  message?: string;
}

export const videoService = {
  /**
   * Generate a video based on user prompt and preferences
   */
  async generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult> {
    try {
      console.log("Starting video generation with params:", params);
      
      // Step 1: Create video project in the database
      const title = params.prompt.substring(0, 100) + (params.prompt.length > 100 ? '...' : '');
      
      const { data: project, error: projectError } = await supabase
        .from("video_projects")
        .insert({
          title: title,
          prompt: params.prompt,
          style: params.style,
          format: params.format || "16:9",
          status: "processing",
          has_audio: params.voiceSettings ? true : false,
          has_captions: false,
          narration_script: params.voiceSettings?.script || null,
          model_version: "gemini-2.0-flash", // Always use the flash model
          brand_settings: params.brandKit ? JSON.stringify(params.brandKit) : null,
          user_id: params.userId
        })
        .select()
        .single();
        
      if (projectError) {
        console.error("Error creating video project:", projectError);
        return { success: false, error: "Failed to create video project" };
      }
      
      if (!project) {
        console.error("No project returned after creation");
        return { success: false, error: "Failed to create video project" };
      }
      
      console.log("Created video project with ID:", project.id);
      
      // Step 2: Generate scenes using AI
      let scenes: SceneBreakdown[] = [];
      try {
        scenes = await aiService.generateScenes(params.prompt);
        console.log(`Generated ${scenes.length} scenes for video:`, scenes);
        
        // Save the generated scenes for future reference
        if (scenes.length > 0) {
          console.log(`Generated ${scenes.length} scenes for video`);
          
          await aiService.saveScript(
            params.userId,
            `Scene breakdown for: ${title}`,
            JSON.stringify(scenes),
            'scene-breakdown'
          );
          
          // Also update the project with the scenes - use VideoProjectUpdate interface
          const update: VideoProjectUpdate = { scenes: scenes };
          await supabase
            .from("video_projects")
            .update(update)
            .eq("id", project.id);
        } else {
          console.error("No scenes were generated");
          throw new Error("Failed to generate scenes for the video");
        }
      } catch (sceneError) {
        console.error("Error generating scenes:", sceneError);
        // Continue with render - the render function will handle empty scenes
      }
      
      // Step 3: Generate audio if voiceover is enabled
      let audioUrl: string | undefined;
      if (params.voiceSettings && params.voiceSettings.script) {
        try {
          const { data: audioData, error: audioError } = await supabase.functions.invoke('generate-audio', {
            body: {
              script: params.voiceSettings.script,
              voiceId: params.voiceSettings.voiceId,
              userId: params.userId,
              projectId: project.id
            }
          });
          
          if (audioError) {
            console.error("Error generating audio:", audioError);
          } else if (audioData && audioData.audioUrl) {
            audioUrl = audioData.audioUrl;
            console.log("Generated audio for video:", audioUrl);
            
            // Update project with audio URL using type assertion for compatibility
            await supabase
              .from("video_projects")
              .update({ audio_url: audioUrl } as any)
              .eq("id", project.id);
          }
        } catch (audioError) {
          console.error("Error with audio generation:", audioError);
          // Continue without audio if there's an error
        }
      }
      
      // Step 4: Start the video render process
      try {
        console.log("Starting render with scenes:", scenes);
        
        const { data: renderData, error: renderError } = await supabase.functions.invoke('render-video', {
          body: {
            projectId: project.id,
            userId: params.userId,
            prompt: params.prompt,
            scenes: scenes,
            style: params.style,
            format: params.format || "16:9",
            brandKit: params.brandKit,
            mediaUrls: params.mediaUrls || [],
            useStockMedia: params.useStockMedia !== false, // Default to true if not specified
            audioUrl: audioUrl,
            has_audio: params.voiceSettings ? true : false,
            has_captions: false,
            modelVersion: "gemini-2.0-flash" // Always use the flash model
          }
        });
        
        if (renderError) {
          console.error("Error invoking render-video function:", renderError);
          
          // Update project status to failed
          await supabase
            .from("video_projects")
            .update({ 
              status: "failed",
              error_message: renderError.message || "Failed to start video rendering"
            })
            .eq("id", project.id);
            
          return { 
            success: false, 
            error: "Failed to start video rendering. Please try again.",
            videoId: project.id
          };
        }
        
        if (!renderData || !renderData.renderId) {
          console.error("No render ID returned");
          
          await supabase
            .from("video_projects")
            .update({ 
              status: "failed",
              error_message: "No render ID returned from rendering service"
            })
            .eq("id", project.id);
          
          return { 
            success: false, 
            error: "Failed to get render ID. Please try again.",
            videoId: project.id
          };
        }
        
        console.log("Render started successfully with ID:", renderData.renderId);
        
        // Update project with render ID
        await supabase
          .from("video_projects")
          .update({ 
            render_id: renderData.renderId,
            status: "processing"
          })
          .eq("id", project.id);
        
        return { 
          success: true, 
          videoId: project.id,
          message: "Video generation started successfully" 
        };
        
      } catch (renderError) {
        console.error("Error starting render:", renderError);
        
        // Update project status to failed
        await supabase
          .from("video_projects")
          .update({ 
            status: "failed",
            error_message: renderError instanceof Error ? renderError.message : "Unknown render error"
          })
          .eq("id", project.id);
          
        return { 
          success: false, 
          error: "Failed to start video rendering. Please try again.",
          videoId: project.id 
        };
      }
    } catch (error) {
      console.error("Error in generateVideo:", error);
      return { 
        success: false, 
        error: "An unexpected error occurred during video generation."
      };
    }
  },
  
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
      
      const processedData = (data || []).map(project => ({
        ...project,
        video_url: mediaService.validateVideoUrl(project.video_url),
        has_audio: Boolean(project.has_audio),
        has_captions: Boolean(project.has_captions)
      }));
      
      return processedData as VideoProject[];
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
      
      const processedData = (data || []).map(project => ({
        ...project,
        video_url: mediaService.validateVideoUrl(project.video_url),
        has_audio: Boolean(project.has_audio),
        has_captions: Boolean(project.has_captions)
      }));
      
      return processedData as VideoProject[];
    } catch (error) {
      console.error('Error in getRecentProjects:', error);
      throw error;
    }
  },
  
  async getProjectById(id: string): Promise<VideoProject | null> {
    try {
      if (!id) {
        console.error("Invalid project ID provided to getProjectById");
        return null;
      }
      
      const { data, error } = await supabase
        .from('video_projects')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error(`Error fetching video project with id ${id}:`, error);
        return null;
      }
      
      if (data) {
        data.video_url = mediaService.validateVideoUrl(data.video_url);
        data.has_audio = Boolean(data.has_audio);
        data.has_captions = Boolean(data.has_captions);
      }
      
      return data as VideoProject;
    } catch (error) {
      console.error('Error in getProjectById:', error);
      throw error;
    }
  },
  
  async createProject(project: Omit<VideoProject, 'id' | 'created_at' | 'updated_at'>): Promise<VideoProject | null> {
    try {
      if (!project.title || !project.prompt || !project.user_id) {
        console.error("Missing required fields for project creation");
        throw new Error("Missing required fields for project creation");
      }
      
      console.log("Creating video project with data:", {
        title: project.title,
        style: project.style,
        has_audio: project.has_audio === true ? "Yes" : "No",
        has_captions: project.has_captions === true ? "Yes" : "No",
        narration_script: project.narration_script?.substring(0, 20) + "..." || "None provided"
      });
      
      const projectWithDefaults = {
        ...project,
        has_audio: Boolean(project.has_audio),
        has_captions: Boolean(project.has_captions),
        narration_script: project.narration_script || null
      };

      const { data, error } = await supabase
        .from('video_projects')
        .insert(projectWithDefaults)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating video project:', error);
        throw error;
      }
      
      console.log("Video project created successfully with ID:", data.id);
      return data as VideoProject;
    } catch (error) {
      console.error('Error in createProject:', error);
      throw error;
    }
  },
  
  async updateProject(id: string, updates: Partial<VideoProject>): Promise<void> {
    try {
      if (!id) {
        console.error("Missing project ID for update");
        throw new Error("Missing project ID");
      }
      
      // Cast updates as VideoProjectUpdate to allow scenes property
      const sanitizedUpdates: VideoProjectUpdate = {
        ...updates,
        has_audio: updates.has_audio !== undefined ? Boolean(updates.has_audio) : undefined,
        has_captions: updates.has_captions !== undefined ? Boolean(updates.has_captions) : undefined,
        narration_script: updates.narration_script || undefined
      };

      console.log(`Updating video project ${id} with data:`, {
        status: sanitizedUpdates.status,
        has_audio: sanitizedUpdates.has_audio,
        has_captions: sanitizedUpdates.has_captions,
        narration_script: sanitizedUpdates.narration_script 
          ? (sanitizedUpdates.narration_script.substring(0, 20) + "...") 
          : "No change"
      });
      
      if (updates.video_url) {
        sanitizedUpdates.video_url = mediaService.validateVideoUrl(updates.video_url);
      }
      
      const { error } = await supabase
        .from('video_projects')
        .update(sanitizedUpdates)
        .eq('id', id);
        
      if (error) {
        console.error(`Error updating video project with id ${id}:`, error);
        throw error;
      }
      
      console.log(`Video project ${id} updated successfully`);
    } catch (error) {
      console.error('Error in updateProject:', error);
      throw error;
    }
  },
  
  async deleteProject(id: string): Promise<void> {
    try {
      if (!id) {
        console.error("Missing project ID for deletion");
        throw new Error("Missing project ID");
      }
      
      const { data: projectData, error: fetchError } = await supabase
        .from('video_projects')
        .select('title, user_id')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error(`Error fetching project data before deletion with id ${id}:`, fetchError);
      }
      
      const { error } = await supabase
        .from('video_projects')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error(`Error deleting video project with id ${id}:`, error);
        throw error;
      }
      
      console.log(`Video project ${id} deleted successfully`);
      
      if (projectData && projectData.user_id) {
        await renderNotifications.createVideoDeletedNotification(
          projectData.user_id,
          projectData.title || 'Untitled'
        );
      }
    } catch (error) {
      console.error('Error in deleteProject:', error);
      throw error;
    }
  },
  
  extractKeywords(description: string): string[] {
    if (!description) return ["video"];
    
    // Extract important nouns and adjectives from the description
    const words = description.split(/\s+/);
    const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'is', 'are', 'was', 'were']);
    
    const keywords = words
      .filter(word => word.length > 3 && !stopWords.has(word.toLowerCase()))
      .map(word => word.replace(/[.,;:!?]/, ''))
      .slice(0, 3); // Take up to 3 keywords
      
    if (keywords.length === 0) {
      return ["video"]; // Fallback
    }
    
    return keywords;
  }
};
