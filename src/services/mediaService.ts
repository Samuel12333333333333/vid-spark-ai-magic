
/**
 * Helper service for handling media-related functionality
 */
export const mediaService = {
  /**
   * Validate a video URL to ensure it's properly formatted
   */
  validateVideoUrl(url: string | undefined | null): string | undefined {
    if (!url) return undefined;
    
    // Ensure URL is properly formatted
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.toString();
    } catch (error) {
      console.error("Invalid video URL:", url);
      return undefined;
    }
  },
  
  /**
   * Generate a thumbnail URL from a video URL
   * This is a simple implementation that assumes thumbnails follow a naming pattern
   */
  generateThumbnailUrl(videoUrl: string | undefined | null): string | undefined {
    if (!videoUrl) return undefined;
    
    // This is a placeholder implementation - adjust based on your actual thumbnail generation logic
    try {
      const url = new URL(videoUrl);
      const path = url.pathname;
      
      // Example pattern: replace .mp4 with .jpg
      if (path.endsWith('.mp4')) {
        const thumbnailPath = path.replace('.mp4', '.jpg');
        return `${url.origin}${thumbnailPath}`;
      }
      
      // If no pattern match, return undefined
      return undefined;
    } catch (error) {
      console.error("Error generating thumbnail URL:", error);
      return undefined;
    }
  }
};

export default mediaService;
