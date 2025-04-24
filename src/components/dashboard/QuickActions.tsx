
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="border rounded-lg p-6 hover:border-smartvid-600 transition-colors">
        <h3 className="font-semibold mb-2">Generate from Text</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Turn your text prompt into a professional video.
        </p>
        <Button className="w-full bg-smartvid-600 hover:bg-smartvid-700" asChild>
          <Link to="/dashboard/generator">Start Creating</Link>
        </Button>
      </div>
      
      <div className="border rounded-lg p-6 hover:border-smartvid-600 transition-colors">
        <h3 className="font-semibold mb-2">Write AI Scripts</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get help writing video scripts and captions.
        </p>
        <Button className="w-full" variant="outline" asChild>
          <Link to="/dashboard/scripts">Open Script Tool</Link>
        </Button>
      </div>
      
      <div className="border rounded-lg p-6 hover:border-smartvid-600 transition-colors">
        <h3 className="font-semibold mb-2">Use a Template</h3>
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
