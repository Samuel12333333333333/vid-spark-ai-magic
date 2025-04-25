
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function DemoVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      
      // Upload the file to Supabase storage
      const { data, error } = await supabase.storage
        .from('demo-videos')
        .upload(`demo-${Date.now()}.mp4`, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('demo-videos')
        .getPublicUrl(data.path);

      setVideoUrl(publicUrl);
      toast.success('Demo video uploaded successfully!');
    } catch (error) {
      console.error('Error uploading demo video:', error);
      toast.error('Failed to upload demo video');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayback = () => {
    const videoElement = document.getElementById('demo-video') as HTMLVideoElement;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      <div className="aspect-video relative flex items-center justify-center bg-gray-800">
        {videoUrl ? (
          <video
            id="demo-video"
            className="w-full h-full object-cover"
            src={videoUrl}
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <input
              type="file"
              accept="video/*"
              onChange={handleUpload}
              className="hidden"
              id="demo-upload"
            />
            <label
              htmlFor="demo-upload"
              className={`flex items-center gap-2 bg-primary/90 hover:bg-primary text-white rounded-lg px-6 py-3 cursor-pointer transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="h-5 w-5" />
              {isLoading ? 'Uploading...' : 'Upload Demo Video'}
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
