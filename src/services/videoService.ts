import { supabase } from "@/integrations/supabase/client";
import { aiService, SceneBreakdown } from "@/services/aiService";
import { toast } from "sonner";
import { mediaService } from "@/services/mediaService";
import { renderNotifications } from "@/services/video/renderNotifications";
import { VideoProjectUpdate } from "@/services/video/types";
import { Json } from "@/integrations/supabase/types";
import { videoRenderService } from "./video/videoRenderService";

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
  scenes?: SceneBreakdown[] | Json; 
  audio_data?: string;
  error_message?: string;
  audio_url?: string;
}

interface VideoGenerationParams {
  prompt: string;
  style: string;
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
  // Add the startRender method that delegates to videoRenderService
  async startRender(
    projectId: string,
    prompt: string,
    style: string,
    scenes: any[] = [],
    hasAudio: boolean = false,
    hasCaptions: boolean = false,
    audioUrl?: string,
    captionsUrl?: string,
    template?: any // For direct template rendering
  ) {
    return videoRenderService.startRender(
      projectId,
      prompt,
      style,
      scenes,
      hasAudio,
      hasCaptions,
      audioUrl,
      captionsUrl,
      template
    );
  },

  /**
   * Generate a video based on user prompt and preferences
   */
  async generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult> {
    try {
      console.log("Starting video generation with params:", params);
      
      // IMPORTANT: Check user's video quota BEFORE starting any video generation
      // This prevents wasting resources on users who have exceeded their limits
      try {
        const { data: usageData, error: usageError } = await supabase.functions.invoke("get_video_usage");
        
        if (!usageError && usageData) {
          // Determine user's tier and limits
          const { data: subscriptionData } = await supabase.functions.invoke("check-subscription");
          const subscription = subscriptionData?.subscription;
          const hasActiveSubscription = subscription && subscription.status === 'active';
          const isPro = hasActiveSubscription && subscription?.plan_name?.toLowerCase().includes('pro');
          const isBusiness = hasActiveSubscription && subscription?.plan_name?.toLowerCase().includes('business');
          
          // Set video limit based on plan tier
          const videosLimit = hasActiveSubscription 
            ? isPro 
              ? 20 
              : isBusiness 
                ? 50 
                : 2 // Free tier
            : 2; // Default free tier
          
          console.log(`Video usage check: ${usageData.count || 0}/${videosLimit}`);
          
          // Block video generation if user is over their limit
          if (usageData.count >= videosLimit) {
            toast.error(
              `You've reached your limit of ${videosLimit} videos${hasActiveSubscription ? ' this billing period' : ' on the free tier'}.`,
              {
                description: hasActiveSubscription 
                  ? `Your limit will reset on ${new Date(usageData.reset_at).toLocaleDateString()}.` 
                  : "Please upgrade to create more videos."
              }
            );
            return { 
              success: false, 
              error: "Usage quota exceeded" 
            };
          }
        }
      } catch (quotaError) {
        console.error("Error checking video quota:", quotaError);
        // Proceed with caution if quota check fails
      }
      
      // Create video project in the database
      const { data: projectData, error: projectError } = await supabase
        .from("video_projects")
        .insert({
          title: `Video: ${params.prompt.substring(0, 50)}${params.prompt.length > 50 ? "..." : ""}`,
          prompt: params.prompt,
          user_id: params.userId,
          style: params.style,
          status: "pending",
          media_source: params.useStockMedia ? "stock" : "upload",
          brand_colors: params.brandKit ? JSON.stringify(params.brandKit) : null,
          narration_script: params.voiceSettings?.script || null
        })
        .select();
        
      if (projectError) {
        console.error("Error creating video project:", projectError);
        return { success: false, error: projectError.message || "An error occurred during video generation" };
      }
      
      if (!projectData || projectData.length === 0) {
        console.error("No project returned after creation");
        return { success: false, error: "Failed to create video project" };
      }
      
      const createdProject = projectData[0];
      console.log("Created video project with ID:", createdProject.id);
      
      // Step 2: Generate scenes using AI
      let scenes: SceneBreakdown[] = [];
      try {
        console.log("Generating scenes from prompt...");
        scenes = await aiService.generateScenes(params.prompt);
        console.log(`Generated ${scenes.length} scenes for video`);
        
        // Save the generated scenes for future reference
        if (scenes.length > 0) {
          await aiService.saveScript(
            params.userId,
            `Scene breakdown for: ${params.prompt.substring(0, 100) + (params.prompt.length > 100 ? '...' : '')}`,
            JSON.stringify(scenes),
            'scene-breakdown'
          );
          
          // Update the project with the scenes - handle as Json type
          try {
            const { error: updateError } = await supabase
              .from("video_projects")
              .update({ scenes: scenes as unknown as Json })
              .eq("id", createdProject.id);
              
            if (updateError) {
              console.error("Failed to update project with scenes:", updateError);
            }
          } catch (sceneUpdateError) {
            console.error("Exception updating scenes:", sceneUpdateError);
            // Continue with render process despite scene update error
          }
        } else {
          console.error("No scenes were generated");
          // Still continue with the process
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
              projectId: createdProject.id
            }
          });
          
          if (audioError) {
            console.error("Error generating audio:", audioError);
          } else if (audioData && audioData.audioUrl) {
            audioUrl = audioData.audioUrl;
            console.log("Generated audio for video:", audioUrl);
            
            // Update project with audio URL - using the proper type
            try {
              const updateData: VideoProjectUpdate = { audio_url: audioUrl };
              const { error: audioUpdateError } = await supabase
                .from("video_projects")
                .update(updateData)
                .eq("id", createdProject.id);
                
              if (audioUpdateError) {
                console.error("Error updating project with audio URL:", audioUpdateError);
              }
            } catch (audioUpdateError) {
              console.error("Exception updating audio URL:", audioUpdateError);
              // Continue despite error
            }
          }
        } catch (audioError) {
          console.error("Error with audio generation:", audioError);
          // Continue without audio if there's an error
        }
      }
      
      // Step 4: Process scenes with videos
      try {
        console.log(`Processing ${scenes.length} scenes with videos`);
        
        for (let i = 0; i < scenes.length; i++) {
          const scene = scenes[i];
          console.log(`Finding video for scene: ${scene.scene}`);
          
          // Add video processing logic here if needed
        }
        
        console.log(`Processed ${scenes.length} scenes with videos`);
      } catch (videoError) {
        console.error("Error processing videos for scenes:", videoError);
      }
      
      // Step 5: Start the video render process
      try {
        console.log("Starting render with scenes:", scenes);
        
        const { data: renderData, error: renderError } = await supabase.functions.invoke('render-video', {
          body: {
            projectId: createdProject.id,
            userId: params.userId,
            prompt: params.prompt,
            scenes: scenes,
            style: params.style,
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
          try {
            await supabase
              .from("video_projects")
              .update({ 
                status: "failed",
                error_message: renderError.message || "Failed to start video rendering"
              })
              .eq("id", createdProject.id);
          } catch (updateError) {
            console.error("Error updating project status:", updateError);
          }
            
          return { 
            success: false, 
            error: "Failed to start video rendering. Please try again.",
            videoId: createdProject.id
          };
        }
        
        if (!renderData || !renderData.renderId) {
          console.error("No render ID returned");
          
          try {
            await supabase
              .from("video_projects")
              .update({ 
                status: "failed",
                error_message: "No render ID returned from rendering service"
              })
              .eq("id", createdProject.id);
          } catch (updateError) {
            console.error("Error updating project status:", updateError);
          }
          
          return { 
            success: false, 
            error: "Failed to get render ID. Please try again.",
            videoId: createdProject.id
          };
        }
        
        console.log("Render started successfully with ID:", renderData.renderId);
        
        // Update project with render ID
        try {
          await supabase
            .from("video_projects")
            .update({ 
              render_id: renderData.renderId,
              status: "processing"
            })
            .eq("id", createdProject.id);
        } catch (updateError) {
          console.error("Error updating project with render ID:", updateError);
          // Continue despite error
        }
        
        return { 
          success: true, 
          videoId: createdProject.id,
          message: "Video generation started successfully" 
        };
        
      } catch (renderError) {
        console.error("Error starting render:", renderError);
        
        // Update project status to failed
        try {
          await supabase
            .from("video_projects")
            .update({ 
              status: "failed",
              error_message: renderError instanceof Error ? renderError.message : "Unknown render error"
            })
            .eq("id", createdProject.id);
        } catch (updateError) {
          console.error("Error updating project status:", updateError);
        }
          
        return { 
          success: false, 
          error: "Failed to start video rendering. Please try again.",
          videoId: createdProject.id 
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
      
      return processedData as unknown as VideoProject[];
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
      
      return processedData as unknown as VideoProject[];
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
      
      return data as unknown as VideoProject;
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
      
      const projectToInsert = {
        ...project,
        has_audio: Boolean(project.has_audio),
        has_captions: Boolean(project.has_captions),
        narration_script: project.narration_script || null,
        scenes: project.scenes ? (project.scenes as unknown as Json) : null
      };

      const { data, error } = await supabase
        .from('video_projects')
        .insert(projectToInsert)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating video project:', error);
        throw error;
      }
      
      console.log("Video project created successfully with ID:", data.id);
      return data as unknown as VideoProject;
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
      
      // Only include specific properties to update and ensure scenes is properly handled
      const sanitizedUpdates: VideoProjectUpdate = {};
      
      // Only copy the properties we want to update
      if (updates.title !== undefined) sanitizedUpdates.title = updates.title;
      if (updates.prompt !== undefined) sanitizedUpdates.prompt = updates.prompt;
      if (updates.status !== undefined) sanitizedUpdates.status = updates.status;
      if (updates.style !== undefined) sanitizedUpdates.style = updates.style;
      if (updates.media_source !== undefined) sanitizedUpdates.media_source = updates.media_source;
      if (updates.brand_colors !== undefined) sanitizedUpdates.brand_colors = updates.brand_colors;
      if (updates.voice_type !== undefined) sanitizedUpdates.voice_type = updates.voice_type;
      if (updates.video_url !== undefined) sanitizedUpdates.video_url = mediaService.validateVideoUrl(updates.video_url);
      if (updates.thumbnail_url !== undefined) sanitizedUpdates.thumbnail_url = updates.thumbnail_url;
      if (updates.narration_script !== undefined) sanitizedUpdates.narration_script = updates.narration_script;
      if (updates.error_message !== undefined) sanitizedUpdates.error_message = updates.error_message;
      if (updates.has_audio !== undefined) sanitizedUpdates.has_audio = Boolean(updates.has_audio);
      if (updates.has_captions !== undefined) sanitizedUpdates.has_captions = Boolean(updates.has_captions);
      if (updates.duration !== undefined) sanitizedUpdates.duration = updates.duration;
      if (updates.render_id !== undefined) sanitizedUpdates.render_id = updates.render_id;
      if (updates.audio_url !== undefined) sanitizedUpdates.audio_url = updates.audio_url;
      if (updates.scenes !== undefined) sanitizedUpdates.scenes = updates.scenes as unknown as Json;

      console.log(`Updating video project ${id} with data:`, {
        status: sanitizedUpdates.status,
        has_audio: sanitizedUpdates.has_audio,
        has_captions: sanitizedUpdates.has_captions,
        narration_script: sanitizedUpdates.narration_script 
          ? (sanitizedUpdates.narration_script.substring(0, 20) + "...") 
          : "No change",
        scenes: sanitizedUpdates.scenes ? `Present` : "No change",
        audio_url: sanitizedUpdates.audio_url || "No change"
      });
      
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
      
      // Create notification only if we have user_id and title
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
