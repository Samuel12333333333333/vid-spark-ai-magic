
export const mediaService = {
  validateVideoUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    
    // Ensure URLs are properly formatted
    try {
      // Check if it's a relative URL
      if (url.startsWith('/')) {
        return url;
      }
      
      // Validate URL format
      new URL(url);
      
      // Additional validation for common video formats
      const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.m4v', '.mkv'];
      const hasValidExtension = videoExtensions.some(ext => 
        url.toLowerCase().includes(ext) || 
        url.includes('video') || 
        url.includes('mp4') ||
        url.includes('shotstack')
      );
      
      // For URLs that don't have explicit extensions but are from known video providers
      const knownVideoHosts = ['pexels.com', 'shotstack', 'youtube', 'vimeo', 'cloudinary'];
      const isFromKnownHost = knownVideoHosts.some(host => url.includes(host));
      
      if (hasValidExtension || isFromKnownHost) {
        return url;
      }
      
      console.warn("URL doesn't appear to be a video:", url);
      return url; // Return it anyway, the player will handle invalid URLs
    } catch (error) {
      console.error("Invalid video URL:", url);
      return null;
    }
  },
  
  getThumbnailFromVideoUrl(videoUrl: string | null): string | null {
    if (!videoUrl) return null;
    
    // If it's a Shotstack URL, they provide thumbnails by convention
    if (videoUrl.includes('shotstack') && videoUrl.endsWith('.mp4')) {
      return videoUrl.replace('.mp4', '-poster.jpg');
    }
    
    // For Pexels videos, use their picture format
    if (videoUrl.includes('pexels.com')) {
      // Pexels often provides preview images in their API response
      // This is just a fallback if the actual thumbnail isn't available
      return null;
    }
    
    // For other video providers, we might need different logic
    return null;
  },
  
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  getVideoDuration(seconds: number | null | undefined): string {
    if (!seconds) return "00:00";
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  },
  
  isVideoFile(fileName: string): boolean {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.m4v'];
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    return videoExtensions.includes(extension);
  },
  
  isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    return imageExtensions.includes(extension);
  },
  
  isAudioFile(fileName: string): boolean {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma'];
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    return audioExtensions.includes(extension);
  },
  
  getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) return '';
    return fileName.substring(lastDotIndex).toLowerCase();
  }
};

export default mediaService;
