
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Download, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { videoService, VideoProject } from "@/services/videoService";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

export default function VideoDetailPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) return;
      
      try {
        setIsLoading(true);
        const videoData = await videoService.getProjectById(videoId);
        
        if (!videoData) {
          toast.error("Video not found");
          navigate("/dashboard/videos");
          return;
        }
        
        setVideo(videoData);
      } catch (error) {
        console.error("Error fetching video:", error);
        toast.error("Failed to load video");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVideo();
  }, [videoId, navigate]);

  const handleDownload = () => {
    if (!video?.video_url) {
      toast.error("No video available to download");
      return;
    }
    
    // Create a temporary anchor element to trigger download
    const a = document.createElement('a');
    a.href = video.video_url;
    a.download = `${video.title || 'video'}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success("Download started");
  };
  
  const handleShare = async () => {
    if (!video?.video_url) {
      toast.error("No video available to share");
      return;
    }
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: "Check out this video I created with SmartVid!",
          url: video.video_url,
        });
      } else {
        // Fallback for browsers that don't support the Web Share API
        await navigator.clipboard.writeText(video.video_url);
        toast.success("Video URL copied to clipboard");
      }
    } catch (error) {
      console.error("Error sharing video:", error);
      toast.error("Failed to share video");
    }
  };
  
  const handleDelete = async () => {
    if (!video?.id) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this video? This action cannot be undone.");
    
    if (confirmed) {
      try {
        await videoService.deleteProject(video.id);
        toast.success("Video deleted successfully");
        navigate("/dashboard/videos");
      } catch (error) {
        console.error("Error deleting video:", error);
        toast.error("Failed to delete video");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-smartvid-600" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Video not found</p>
        <Button asChild>
          <a href="/dashboard/videos">Back to Videos</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/videos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Videos
        </Button>
        
        <div className="flex gap-2">
          {video.video_url && (
            <>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <Card className="overflow-hidden">
        <div className="relative bg-black">
          {video.video_url ? (
            <div className="w-full aspect-video">
              <video 
                className="w-full h-full object-contain"
                poster={video.thumbnail_url}
                controls
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={video.video_url} type="video/mp4" />
                Your browser does not support video playback.
              </video>
            </div>
          ) : (
            <div className="w-full aspect-video flex items-center justify-center bg-gray-900">
              <p className="text-white">No video available</p>
            </div>
          )}
        </div>
        
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{video.title}</h1>
                <Badge variant={
                  video.status === "completed" ? "default" : 
                  video.status === "processing" ? "secondary" : 
                  "destructive"
                }>
                  {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                </Badge>
              </div>
              
              <p className="text-muted-foreground">
                Created {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
              </p>
              
              {video.duration && (
                <p className="text-sm text-muted-foreground">
                  Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Prompt</h3>
            <p className="whitespace-pre-wrap rounded-md bg-muted p-4">{video.prompt}</p>
          </div>
          
          {video.style && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Style</h3>
              <p>{video.style}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
