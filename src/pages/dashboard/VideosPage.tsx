
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Video, Plus } from "lucide-react";

export default function VideosPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Videos</h1>
          <p className="text-muted-foreground">
            Manage and download your generated videos
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/generator">
            <Plus className="h-4 w-4 mr-2" />
            Create New Video
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Video className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            You haven't created any videos yet. Start by generating your first video!
          </p>
          <Button asChild>
            <Link to="/dashboard/generator">Create Your First Video</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
