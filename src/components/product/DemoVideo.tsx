
import { useState } from 'react';
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEMO_VIDEO_URL = "https://dijjaulwbvdcnjbqrjdw.supabase.co/storage/v1/object/public/demo-videos//SmartVideofy%20-%20AI-Powered%20Video%20Generator.mp4";

export function DemoVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

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
      <div className="aspect-video relative">
        <video
          id="demo-video"
          className="w-full h-full object-cover"
          src={DEMO_VIDEO_URL}
          poster="/placeholder.svg"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls
        />
        <div className="absolute inset-0 flex items-center justify-center">
          {!isPlaying && (
            <Button
              onClick={togglePlayback}
              size="lg"
              className="bg-primary/90 hover:bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center"
              aria-label="Play demo video"
            >
              <Play className="h-8 w-8" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
