
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, FileEdit, Trash2, X, RefreshCw } from "lucide-react";
import { VideoProject } from "@/types/supabase";
import { videoService } from "@/services/videoService";
import { renderStatusService } from "@/services/video/renderStatusService";
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
  const [processingProjects, setProcessingProjects] = useState<Record<string, boolean>>({});
  const { user } = useAuth();

  // Setup processing status tracking
  useEffect(() => {
    const processingProjectsMap: Record<string, boolean> = {};
    const processingIds: string[] = [];
    
    projects.forEach(project => {
      if (project.status === "processing" && project.render_id) {
        processingProjectsMap[project.id] = true;
        processingIds.push(project.id);
      }
    });
    
    setProcessingProjects(processingProjectsMap);
    
    // Start polling for any processing projects
    if (processingIds.length > 0) {
      const pollIntervals: Record<string, NodeJS.Timeout> = {};
      
      processingIds.forEach(projectId => {
        const project = projects.find(p => p.id === projectId);
        if (project?.render_id) {
          pollIntervals[projectId] = setInterval(() => {
            checkProjectStatus(projectId, project.render_id!);
          }, 10000); // Check every 10 seconds
        }
      });
      
      // Clean up intervals on unmount
      return () => {
        Object.values(pollIntervals).forEach(interval => clearInterval(interval));
      };
    }
  }, [projects]);

  // Function to check project status
  const checkProjectStatus = async (projectId: string, renderId: string) => {
    try {
      const status = await renderStatusService.updateRenderStatus(projectId, renderId);
      
      if (status === 'completed' || status === 'failed') {
        // Stop polling for this project
        setProcessingProjects(prev => ({
          ...prev,
          [projectId]: false
        }));
      }
    } catch (error) {
      console.error(`Error checking status for project ${projectId}:`, error);
    }
  };

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

  // Retry processing a failed video
  const retryProcessing = async (project: VideoProject) => {
    if (!project || !project.id || !project.render_id) {
      toast.error("Cannot retry processing - missing project information");
      return;
    }
    
    toast.info("Checking render status...");
    
    try {
      // Mark as processing
      setProcessingProjects(prev => ({
        ...prev,
        [project.id]: true
      }));
      
      // Check the status again
      const status = await renderStatusService.updateRenderStatus(project.id, project.render_id);
      
      if (status === 'completed') {
        toast.success("Good news! Your video is actually complete.");
        setProcessingProjects(prev => ({
          ...prev,
          [project.id]: false
        }));
      } else if (status === 'processing' || status === 'pending') {
        toast.info("Video is still processing. We'll keep checking.");
      } else {
        // If still failed, offer to recreate
        setProcessingProjects(prev => ({
          ...prev,
          [project.id]: false
        }));
        toast.error("Video processing failed. Please try creating a new video.");
      }
    } catch (error) {
      console.error("Error retrying video processing:", error);
      toast.error("Failed to check video status");
      
      setProcessingProjects(prev => ({
        ...prev,
        [project.id]: false
      }));
    }
  };

  const deleteProject = async (id: string, title: string) => {
    try {
      // First, create a notification about the deletion
      if (user?.id) {
        // Create notification for video deletion
        await notificationService.createNotification({
          user_id: user.id, 
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
      {projects.map((project) => {
        const isVideoReady = project.status === "completed" || project.status === "done";
        const isProcessing = project.status === "processing" || processingProjects[project.id];
        const isFailed = project.status === "failed" && !processingProjects[project.id];
        
        return (
          <Card key={project.id} className="overflow-hidden">
            <div className="relative">
              <Link to={`/dashboard/videos/${project.id}`}>
                {project.video_url && isVideoReady ? (
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
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-sm font-medium px-3 py-1 bg-smartvid-600 rounded-full flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </div>
                </div>
              )}
              {isFailed && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="flex flex-col gap-2 items-center">
                    <div className="text-white text-sm font-medium px-3 py-1 bg-red-600 rounded-full">
                      Failed
                    </div>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="bg-white text-black hover:bg-gray-100"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        retryProcessing(project);
                      }}
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Check Status
                    </Button>
                  </div>
                </div>
              )}
              {isVideoReady && (
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
                  {project.render_id && (
                    <p className="text-xs text-muted-foreground truncate" title={project.render_id}>
                      ID: {project.render_id.substring(0, 8)}...
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {(isVideoReady || isFailed) && (
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteProject(project.id, project.title);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
