
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, FileEdit, Trash2 } from "lucide-react";
import { VideoProject } from "@/services/videoService";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface RecentProjectsProps {
  projects: VideoProject[];
  onDelete?: (id: string) => Promise<void>;
}

export function RecentProjects({ projects, onDelete }: RecentProjectsProps) {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const handlePlayVideo = (id: string, event: React.MouseEvent) => {
    const video = document.getElementById(`video-${id}`) as HTMLVideoElement;
    if (video) {
      event.stopPropagation();
      event.preventDefault();
      
      if (video.paused) {
        // Pause any other playing videos
        document.querySelectorAll('video').forEach(v => {
          if (v.id !== `video-${id}` && !v.paused) {
            v.pause();
          }
        });
        
        video.play();
        setPlayingVideo(id);
      } else {
        video.pause();
        setPlayingVideo(null);
      }
    }
  };
  
  const handleDeleteProject = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    if (!onDelete) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this video?");
    if (confirmed) {
      try {
        await onDelete(id);
        toast.success("Video deleted successfully");
      } catch (error) {
        console.error("Error deleting video:", error);
        toast.error("Failed to delete video");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Card key={project.id} className="overflow-hidden group hover:shadow-md transition-shadow">
          <Link to={`/dashboard/videos/${project.id}`} className="block">
            <div className="relative">
              {project.video_url && project.status === "completed" ? (
                <div className="w-full aspect-video bg-black overflow-hidden">
                  <video 
                    id={`video-${project.id}`}
                    className="w-full h-full object-cover" 
                    poster={project.thumbnail_url || "/placeholder.svg"}
                    muted={isMobile}
                    playsInline
                    onClick={(e) => handlePlayVideo(project.id, e)}
                  >
                    <source src={project.video_url} type="video/mp4" />
                    Your browser does not support video playback.
                  </video>
                  <div 
                    className={`absolute inset-0 flex items-center justify-center ${playingVideo === project.id ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                    onClick={(e) => handlePlayVideo(project.id, e)}
                  >
                    <div className="rounded-full bg-black/60 p-3">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
                  <img
                    src={project.thumbnail_url || "/placeholder.svg"}
                    alt={project.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </div>
              )}
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
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-1">{project.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  {project.status === "completed" && (
                    <>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        asChild
                      >
                        <Link to={`/dashboard/videos/${project.id}`}>
                          <FileEdit className="h-4 w-4" />
                        </Link>
                      </Button>
                      {onDelete && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => handleDeleteProject(project.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}
