import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, FileEdit, Trash2, Check, X } from "lucide-react";
import { VideoProject } from "@/types/supabase";
import { videoService } from "@/services/videoService";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { notificationService } from "@/services/notificationService";

interface RecentProjectsProps {
  projects: VideoProject[];
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  const [loadedVideos, setLoadedVideos] = useState<Record<string, boolean>>({});
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const { user } = useAuth();

  // Handle video load start
  const handleVideoLoadStart = (id: string) => {
    console.log(`Starting to load video: ${id}`);
  };

  // Handle video loaded successfully
  const handleVideoLoaded = (id: string) => {
    console.log(`Video loaded successfully: ${id}`);
    setLoadedVideos(prev => ({ ...prev, [id]: true }));
  };

  // Handle video load error
  const handleVideoError = (id: string) => {
    console.error(`Error loading video: ${id}`);
    toast.error("Error loading video");
    setLoadedVideos(prev => ({ ...prev, [id]: false }));
  };

  // Play the video
  const playVideo = (id: string) => {
    setPlayingVideo(id);
    const videoElement = document.getElementById(`video-${id}`) as HTMLVideoElement;
    if (videoElement) {
      videoElement.play().catch(err => {
        console.error("Error playing video:", err);
        toast.error("Unable to play video");
      });
    }
  };

  // Stop the video
  const stopVideo = () => {
    if (playingVideo) {
      const videoElement = document.getElementById(`video-${playingVideo}`) as HTMLVideoElement;
      if (videoElement) {
        videoElement.pause();
        videoElement.currentTime = 0;
      }
      setPlayingVideo(null);
    }
  };

  const deleteProject = async (id: string, title: string) => {
    try {
      // First, create a notification about the deletion
      if (user?.id) {
        // Create notification for video deletion
        await notificationService.createNotification({
          user_id: user.id, // Using the correct property name
          title: "Video Deleted",
          message: `Your video "${title || 'Untitled'}" has been deleted.`,
          type: 'video_deleted',
          metadata: { 
            action: 'delete',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Now delete the video project
      await videoService.deleteProject(id);
      toast.success("Video deleted successfully");
      // You would typically refresh the videos list here
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Card key={project.id} className="overflow-hidden">
          <div className="relative">
            <Link to={`/dashboard/videos/${project.id}`}>
              {project.video_url && project.status === "completed" ? (
                <div className="w-full aspect-video bg-black overflow-hidden">
                  <video 
                    id={`video-${project.id}`}
                    className="w-full h-full object-cover" 
                    poster={project.thumbnail_url || "/placeholder.svg"}
                    muted
                    preload="metadata"
                    onLoadStart={() => handleVideoLoadStart(project.id)}
                    onLoadedData={() => handleVideoLoaded(project.id)}
                    onError={() => handleVideoError(project.id)}
                  >
                    <source src={project.video_url} type="video/mp4" />
                    Your browser does not support video playback.
                  </video>
                  <div 
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/40" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      playingVideo === project.id ? stopVideo() : playVideo(project.id);
                    }}
                  >
                    <div className="rounded-full bg-black/60 p-3">
                      {playingVideo === project.id ? (
                        <X className="h-8 w-8 text-white" />
                      ) : (
                        <Play className="h-8 w-8 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={project.thumbnail_url || "/placeholder.svg"}
                  alt={project.title}
                  className="w-full aspect-video object-cover"
                  loading="lazy"
                />
              )}
            </Link>
            {project.status === "processing" && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-sm font-medium px-3 py-1 bg-smartvid-600 rounded-full">
                  Processing...
                </div>
              </div>
            )}
            {project.status === "failed" && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-sm font-medium px-3 py-1 bg-red-600 rounded-full">
                  Failed
                </div>
              </div>
            )}
            {project.status === "completed" && (
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white"
                asChild
              >
                <Link to={`/dashboard/videos/${project.id}`}>
                  <Play className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
          <CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <Link to={`/dashboard/videos/${project.id}`} className="hover:underline">
                  <h3 className="font-medium text-sm line-clamp-1">{project.title}</h3>
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(project.created_at || ''), { addSuffix: true })}
                </p>
              </div>
              <div className="flex gap-1">
                {project.status === "completed" && (
                  <>
                    <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                      <Link to={`/dashboard/videos/${project.id}`}>
                        <FileEdit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteProject(project.id, project.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
