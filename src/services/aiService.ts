
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
      const { data, error } = await supabase.functions.invoke('generate-scenes', {
        body: { prompt }
      });
      
      if (error) throw error;
      
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
