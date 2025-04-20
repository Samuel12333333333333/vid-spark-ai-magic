
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { VideoProject, videoService } from "@/services/videoService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Play, 
  Share2, 
  Download, 
  Pencil, 
  Save, 
  Trash2, 
  ArrowLeft, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ClockIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<VideoProject | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch the video project
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        if (!id) return;
        const projectData = await videoService.getProjectById(id);
        if (projectData) {
          setProject(projectData);
          setTitle(projectData.title);
        } else {
          toast.error("Video project not found");
          navigate("/dashboard/videos");
        }
      } catch (error) {
        console.error("Error fetching video project:", error);
        toast.error("Failed to load video project");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id, navigate]);

  // Handle editing the project title
  const handleSaveTitle = async () => {
    if (!project || !id) return;
    
    try {
      await videoService.updateProject(id, { title });
      toast.success("Video title updated");
      setProject({ ...project, title });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating video title:", error);
      toast.error("Failed to update video title");
    }
  };

  // Handle video playback
  const togglePlayback = () => {
    const videoElement = document.getElementById("project-video") as HTMLVideoElement;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play().catch(err => {
          console.error("Error playing video:", err);
          toast.error("Unable to play video");
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle copying the video link
  const copyVideoLink = () => {
    if (!project?.video_url) return;
    
    navigator.clipboard.writeText(project.video_url)
      .then(() => toast.success("Video link copied to clipboard"))
      .catch(() => toast.error("Failed to copy link"));
  };

  // Handle deleting the project
  const handleDelete = async () => {
    if (!project || !id) return;
    
    if (confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      try {
        await videoService.deleteProject(id);
        toast.success("Video deleted successfully");
        navigate("/dashboard/videos");
      } catch (error) {
        console.error("Error deleting video:", error);
        toast.error("Failed to delete video");
      }
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <ClockIcon className="h-12 w-12 animate-spin text-smartvid-600" />
          <p>Loading video details...</p>
        </div>
      </div>
    );
  }

  // Render not found state
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Video Not Found</h2>
        <p className="text-muted-foreground">The video you're looking for doesn't exist or was deleted.</p>
        <Button onClick={() => navigate("/dashboard/videos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Videos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/dashboard/videos")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Videos
        </Button>
        
        <div className="flex gap-2">
          {project.status === "completed" && (
            <>
              <Button variant="outline" onClick={copyVideoLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </>
          )}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {project.status === "completed" && project.video_url ? (
              <video 
                id="project-video"
                src={project.video_url} 
                className="w-full h-full" 
                poster={project.thumbnail_url || "/placeholder.svg"}
                controls
                onClick={togglePlayback}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {project.status === "processing" ? (
                  <div className="flex flex-col items-center gap-2">
                    <Clock className="h-12 w-12 animate-spin text-smartvid-600" />
                    <p className="text-white text-center">Your video is being processed...</p>
                  </div>
                ) : project.status === "failed" ? (
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <p className="text-white text-center">Video generation failed</p>
                  </div>
                ) : (
                  <img 
                    src={project.thumbnail_url || "/placeholder.svg"} 
                    alt={project.title} 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                {isEditing ? (
                  <div className="w-full space-y-2">
                    <Input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-xl font-bold"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveTitle}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setTitle(project.title);
                        setIsEditing(false);
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <CardTitle className="mb-2">{project.title}</CardTitle>
                      <CardDescription>
                        Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Status</h3>
                <div className="flex items-center">
                  {project.status === "completed" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span>Completed</span>
                    </>
                  ) : project.status === "processing" ? (
                    <>
                      <Clock className="h-4 w-4 text-orange-500 mr-2" />
                      <span>Processing</span>
                    </>
                  ) : project.status === "failed" ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span>Failed</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                      <span>Pending</span>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Prompt</h3>
                <p className="text-sm text-muted-foreground">{project.prompt}</p>
              </div>
              
              {project.style && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Style</h3>
                  <p className="text-sm text-muted-foreground capitalize">{project.style}</p>
                </div>
              )}
              
              {project.has_audio && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Audio</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.has_audio ? "Audio included" : "No audio"}
                  </p>
                </div>
              )}
              
              {project.has_captions && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Captions</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.has_captions ? "Captions included" : "No captions"}
                  </p>
                </div>
              )}
              
              {project.narration_script && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Narration Script</h3>
                  <Textarea 
                    value={project.narration_script} 
                    readOnly 
                    className="text-sm h-20 resize-none"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter>
              {project.status === "completed" && project.video_url && (
                <Button className="w-full" onClick={togglePlayback}>
                  {isPlaying ? (
                    <>Pause Video</>
                  ) : (
                    <><Play className="mr-2 h-4 w-4" /> Play Video</>
                  )}
                </Button>
              )}
              {project.status === "failed" && (
                <Button className="w-full" onClick={() => navigate("/dashboard/generator", { state: { projectToRetry: project } })}>
                  Try Again
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
