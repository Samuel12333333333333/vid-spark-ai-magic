
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { VideoCamera, FileText, Layout } from "lucide-react";

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="border rounded-lg p-6 hover:border-smartvid-600 transition-colors hover:shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <VideoCamera className="h-5 w-5 text-smartvid-600" />
          <h3 className="font-semibold">Generate from Text</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Turn your text prompt into a professional video.
        </p>
        <Button className="w-full bg-smartvid-600 hover:bg-smartvid-700" asChild>
          <Link to="/dashboard/generator">Start Creating</Link>
        </Button>
      </div>
      
      <div className="border rounded-lg p-6 hover:border-smartvid-600 transition-colors hover:shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-smartvid-600" />
          <h3 className="font-semibold">Write AI Scripts</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Get help writing video scripts and captions.
        </p>
        <Button className="w-full" variant="outline" asChild>
          <Link to="/dashboard/scripts">Open Script Tool</Link>
        </Button>
      </div>
      
      <div className="border rounded-lg p-6 hover:border-smartvid-600 transition-colors hover:shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Layout className="h-5 w-5 text-smartvid-600" />
          <h3 className="font-semibold">Use a Template</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Start with a pre-designed video template.
        </p>
        <Button className="w-full" variant="outline" asChild>
          <Link to="/dashboard/templates">Browse Templates</Link>
        </Button>
      </div>
    </div>
  );
}
