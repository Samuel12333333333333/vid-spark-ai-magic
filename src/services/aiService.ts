
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/types/supabase";

export interface SceneBreakdown {
  scene: string;
  description: string;
  visualKeywords: string[];
  videoUrl?: string;
}

// Update ScriptType to include all script types used in the AIScriptGenerator component
export type ScriptType = 'scene-breakdown' | 'voice-over' | 'captions' | 'hook' | 'full' | 'caption' | 'hashtag';

export const aiService = {
  /**
   * Generate scene breakdowns from a prompt
   */
  async generateScenes(prompt: string): Promise<SceneBreakdown[]> {
    try {
      console.log("Generating scenes for prompt:", prompt);
      
      // Call the OpenAI-powered Supabase edge function
      const { data, error } = await supabase.functions.invoke('generate-scenes', {
        body: { 
          prompt: prompt,
          maxScenes: 5 // Limit to 5 scenes for better quality
        }
      });
      
      if (error) {
        console.error("Error generating scenes:", error);
        throw error;
      }
      
      if (!data || !data.scenes || !Array.isArray(data.scenes)) {
        console.error("Invalid scene data returned:", data);
        throw new Error("Failed to generate scenes");
      }
      
      console.log(`Generated ${data.scenes.length} scenes`);
      return data.scenes;
    } catch (error) {
      console.error("Exception in generateScenes:", error);
      // Return a simple default scene on error
      return [
        {
          scene: "Introduction",
          description: "A brief introduction to the topic.",
          visualKeywords: ["introduction", "begin", "start"]
        }
      ];
    }
  },
  
  /**
   * Generate a voice-over script from a prompt
   */
  async generateScript(prompt: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: { prompt }
      });
      
      if (error) {
        console.error("Error generating script:", error);
        throw error;
      }
      
      if (!data || !data.script) {
        throw new Error("No script generated");
      }
      
      return data.script;
    } catch (error) {
      console.error("Exception in generateScript:", error);
      return `Here's a script about ${prompt}...`;
    }
  },
  
  /**
   * Save a script for future reference
   */
  async saveScript(
    userId: string,
    title: string,
    content: string,
    type: ScriptType
  ): Promise<string | null> {
    try {
      // Save the script to the scripts table
      const { data, error } = await supabase
        .from('scripts')
        .insert({
          user_id: userId,
          title,
          content,
          type
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error saving script:", error);
        throw error;
      }
      
      return data.id;
    } catch (error) {
      console.error("Exception in saveScript:", error);
      return null;
    }
  },
  
  /**
   * Get saved scripts for a user
   */
  async getScripts(userId: string, type?: ScriptType): Promise<any[]> {
    try {
      let query = supabase
        .from('scripts')
        .select('*')
        .eq('user_id', userId);
      
      if (type) {
        query = query.eq('type', type);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error getting scripts:", error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Exception in getScripts:", error);
      return [];
    }
  },
  
  /**
   * Generate video captions from a script
   */
  async generateCaptions(script: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-captions', {
        body: { script }
      });
      
      if (error) {
        console.error("Error generating captions:", error);
        throw error;
      }
      
      if (!data || !data.captions || !Array.isArray(data.captions)) {
        throw new Error("No captions generated");
      }
      
      return data.captions;
    } catch (error) {
      console.error("Exception in generateCaptions:", error);
      return [];
    }
  }
};

export default aiService;
