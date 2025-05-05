
import { useState, useEffect } from 'react';
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const DEMO_VIDEO_URL = "https://dijjaulwbvdcnjbqrjdw.supabase.co/storage/v1/object/public/demo-videos//SmartVideofy%20-%20AI-Powered%20Video%20Generator.mp4";
const DEMO_THUMBNAIL_URL = "/lovable-uploads/41e5161f-9671-4119-b3c6-2ac2b15d7071.png";

export function DemoVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const togglePlayback = () => {
    const videoElement = document.getElementById('demo-video') as HTMLVideoElement;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
        if (!hasPlayed) setHasPlayed(true);
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Auto-play when scrolled into view option (disabled by default)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasPlayed && false) { // Set to true to enable autoplay
          const videoElement = document.getElementById('demo-video') as HTMLVideoElement;
          if (videoElement) {
            videoElement.play().catch(err => console.log('Autoplay prevented:', err));
            setIsPlaying(true);
            setHasPlayed(true);
          }
        }
      },
      { threshold: 0.7 } // 70% of the component must be visible
    );

    const demoVideo = document.getElementById('demo-video-container');
    if (demoVideo) observer.observe(demoVideo);

    return () => {
      if (demoVideo) observer.unobserve(demoVideo);
    };
  }, [hasPlayed]);

  return (
    <div id="demo-video-container" className="max-w-5xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden shadow-2xl relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Animated glow effect on hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 transition-opacity duration-500"
          animate={{ opacity: isHovering ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        <div className="aspect-video relative overflow-hidden">
          {/* Video watermark/badge */}
          <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white font-medium flex items-center space-x-1">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
            <span>SmartVid Demo</span>
          </div>
          
          <video
            id="demo-video"
            className="w-full h-full object-cover"
            src={DEMO_VIDEO_URL}
            poster={DEMO_THUMBNAIL_URL}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls
          />
          
          {/* Overlay with play button - shown when not playing */}
          {!isPlaying && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={togglePlayback}
                  size="lg"
                  className="bg-primary/90 hover:bg-primary text-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg shadow-primary/20 border border-white/10"
                  aria-label="Play demo video"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Play className="h-10 w-10" />
                  </motion.div>
                </Button>
              </motion.div>
              
              <div className="absolute bottom-8 left-0 right-0 text-center">
                <motion.p 
                  className="text-white/90 text-lg font-medium drop-shadow-md px-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  See how SmartVid transforms text into stunning videos
                </motion.p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
