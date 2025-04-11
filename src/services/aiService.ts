
import { supabase } from "@/integrations/supabase/client";

export interface SceneBreakdown {
  id: string;
  scene: string;
  description: string;
  keywords: string[];
  duration: number;
}

export const aiService = {
  async generateScenes(prompt: string): Promise<SceneBreakdown[]> {
    try {
      console.log("Calling generate-scenes function with prompt:", prompt);
      
      const { data, error } = await supabase.functions.invoke('generate-scenes', {
        body: { prompt }
      });
      
      if (error) {
        console.error("Error from generate-scenes function:", error);
        throw new Error(`Failed to generate scenes: ${error.message}`);
      }
      
      if (!data) {
        console.error("No data returned from generate-scenes function");
        throw new Error("No response from scene generation service");
      }

      if (data.error) {
        console.error("Error in generate-scenes response:", data.error);
        throw new Error(data.error.details || data.error);
      }
      
      if (!data.scenes || !Array.isArray(data.scenes)) {
        console.error("Invalid response from generate-scenes function:", data);
        throw new Error("Invalid response from scene generation service");
      }
      
      return data.scenes;
    } catch (error) {
      console.error('Error generating scenes:', error);
      throw error;
    }
  },
  
  async saveScript(userId: string, title: string, content: string, type: string = 'scene-breakdown'): Promise<void> {
    try {
      const { error } = await supabase
        .from('scripts')
        .insert({
          user_id: userId,
          title,
          content,
          type
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error saving script:', error);
      throw error;
    }
  }
};
