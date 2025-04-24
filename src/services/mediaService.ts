import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const mediaService = {
  // Make sure this method exists and works correctly
  validateVideoUrl(url?: string | null): string | undefined {
    if (!url) return undefined;
    
    try {
      // Ensure URL is valid
      new URL(url);
      return url;
    } catch (error) {
      console.error("Invalid video URL:", url);
      return undefined;
    }
  },
  
  // Add or update these methods for better storage handling
  async getVideoCaption(filePath: string): Promise<string | null> {
    try {
      if (!filePath) {
        throw new Error("No caption file path provided");
      }
      
      // Extract bucket and path information
      const pathParts = filePath.split('/');
      const bucketName = pathParts[0];
      const captionPath = pathParts.slice(1).join('/');
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(captionPath);
        
      if (error) {
        console.error("Error downloading caption file:", error);
        throw error;
      }
      
      if (!data) {
        return null;
      }
      
      // Convert blob to text
      const captionText = await data.text();
      return captionText;
    } catch (error) {
      console.error("Error retrieving video caption:", error);
      // Don't show errors to users for captions - they're not critical
      return null;
    }
  },
  
  async getAudioFile(filePath: string): Promise<Blob | null> {
    try {
      if (!filePath) {
        throw new Error("No audio file path provided");
      }
      
      // Extract bucket and path information
      const pathParts = filePath.split('/');
      const bucketName = pathParts[0];
      const audioPath = pathParts.slice(1).join('/');
      
      // Log the request to help with debugging
      console.log(`Requesting audio file from bucket: ${bucketName}, path: ${audioPath}`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(audioPath);
        
      if (error) {
        console.error("Error downloading audio file:", error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error("Error retrieving audio file:", error);
      toast.error("Failed to load audio file. Please try again later.");
      return null;
    }
  },
  
  async uploadMediaFile(bucketName: string, filePath: string, file: File): Promise<string | null> {
    try {
      if (!file) {
        throw new Error("No file provided for upload");
      }
      
      // Check file size
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error("File size exceeds 50MB limit");
      }
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error("Error uploading media file:", error);
        throw error;
      }
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
        
      return publicUrl;
    } catch (error) {
      console.error("Error in uploadMediaFile:", error);
      
      if (error instanceof Error) {
        toast.error(`Upload failed: ${error.message}`);
      } else {
        toast.error("Failed to upload file. Please try again.");
      }
      
      return null;
    }
  }
};
