
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Utility functions for video API integrations
 */
export const videoApiUtils = {
  /**
   * Test if a video API connection is working
   */
  async testShotstackApiKey(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke("test-shotstack", {
        body: {}
      });
      
      if (error) {
        console.error("Error testing Shotstack API:", error);
        toast.error("Failed to connect to Shotstack API", {
          description: error.message
        });
        return false;
      }
      
      if (data && data.success) {
        toast.success("Successfully connected to Shotstack API");
        return true;
      } else {
        const errorMsg = data?.error || "Invalid API key";
        console.error("Shotstack API validation failed:", errorMsg);
        toast.error("Shotstack API validation failed", {
          description: errorMsg
        });
        return false;
      }
    } catch (error) {
      console.error("Exception testing Shotstack API:", error);
      toast.error("Error connecting to Shotstack API", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      return false;
    }
  },
  
  /**
   * Get the supported video formats from Shotstack
   */
  async getSupportedFormats(): Promise<string[]> {
    // This would typically be an API call, but for now we'll return the standard formats
    return ["mp4", "mov", "gif", "webm"];
  }
};

export default videoApiUtils;
