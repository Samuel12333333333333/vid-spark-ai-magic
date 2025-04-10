
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, FileEdit, Trash2 } from "lucide-react";
import { VideoProject } from "@/services/videoService";
import { formatDistanceToNow } from "date-fns";

interface RecentProjectsProps {
  projects: VideoProject[];
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Card key={project.id} className="overflow-hidden">
          <div className="relative">
            <img
              src={project.thumbnail_url || "/placeholder.svg"}
              alt={project.title}
              className="w-full aspect-video object-cover"
            />
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
                <h3 className="font-medium text-sm line-clamp-1">{project.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="flex gap-1">
                {project.status === "completed" && (
                  <>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <FileEdit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
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
