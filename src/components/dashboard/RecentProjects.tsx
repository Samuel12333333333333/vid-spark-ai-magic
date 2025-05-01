
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoProject } from "@/services/videoService";
import { formatDistanceToNow } from "date-fns";
import { Eye, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";

interface RecentProjectsProps {
  projects: VideoProject[];
  onDelete?: (id: string) => Promise<void>;
}

export function RecentProjects({ projects, onDelete }: RecentProjectsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onDelete) return;
    
    try {
      setDeletingId(id);
      await onDelete(id);
      toast.success("Video deleted successfully");
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    } finally {
      setDeletingId(null);
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': 
        return 'default';
      case 'processing': 
        return 'secondary';
      case 'pending': 
        return 'outline';
      case 'failed': 
        return 'destructive';
      default: 
        return 'outline';
    }
  };
  
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No videos found</p>
        <Button asChild>
          <Link to="/dashboard/generator">Create Your First Video</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Link 
          key={project.id} 
          to={`/dashboard/videos/${project.id}`} 
          className="block group"
        >
          <Card className="h-full overflow-hidden transition-all hover:shadow-md">
            <div className="relative aspect-video bg-muted overflow-hidden">
              {project.status === 'completed' && project.video_url ? (
                <video 
                  className="w-full h-full object-cover"
                  src={project.video_url}
                  poster={project.thumbnail_url}
                  muted
                  preload="metadata"
                />
              ) : project.status === 'processing' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 className="h-12 w-12 animate-spin text-white" />
                </div>
              ) : project.status === 'failed' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <p className="text-white font-medium">Generation Failed</p>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <p className="text-white font-medium">Processing...</p>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                <Button variant="outline" size="sm" className="text-white border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20">
                  <Eye className="mr-2 h-3 w-3" />
                  View
                </Button>
                
                {onDelete && (
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => handleDelete(e, project.id)}
                    disabled={deletingId === project.id}
                  >
                    {deletingId === project.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium line-clamp-1">{project.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant={getBadgeVariant(project.status)}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
