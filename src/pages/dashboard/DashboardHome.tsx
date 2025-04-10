
import { Button } from "@/components/ui/button";
import { RecentProjects } from "@/components/dashboard/RecentProjects";
import { TemplateCard } from "@/components/dashboard/TemplateCard";
import { Link } from "react-router-dom";
import { Plus, ArrowRight } from "lucide-react";

export default function DashboardHome() {
  // Mock data for recent projects
  const recentProjects = [
    {
      id: "1",
      title: "Product Launch Announcement",
      thumbnail: "/placeholder.svg",
      status: "completed" as const,
      date: "Today",
    },
    {
      id: "2",
      title: "Social Media Ad",
      thumbnail: "/placeholder.svg",
      status: "processing" as const,
      date: "Today",
    },
    {
      id: "3",
      title: "Educational Tutorial",
      thumbnail: "/placeholder.svg",
      status: "completed" as const,
      date: "Yesterday",
    },
  ];

  // Mock data for templates
  const templates = [
    {
      id: "t1",
      name: "Product Showcase",
      description: "Highlight your product features in a clean, professional format.",
      thumbnail: "/placeholder.svg",
      category: "Marketing",
    },
    {
      id: "t2",
      name: "Social Media Story",
      description: "Engaging vertical format optimized for Instagram and TikTok.",
      thumbnail: "/placeholder.svg",
      category: "Social",
    },
    {
      id: "t3",
      name: "Educational Explainer",
      description: "Clear step-by-step format to explain complex concepts.",
      thumbnail: "/placeholder.svg",
      category: "Education",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">What would you like to create today?</p>
        </div>
        <Button className="mt-4 md:mt-0 bg-smartvid-600 hover:bg-smartvid-700" asChild>
          <Link to="/dashboard/generator">
            <Plus className="mr-2 h-4 w-4" />
            Create New Video
          </Link>
        </Button>
      </div>

      {/* Recent Projects Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/videos">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <RecentProjects projects={recentProjects} />
      </div>

      {/* Quick Actions */}
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

      {/* Templates Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Popular Templates</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/templates">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard key={template.id} {...template} />
          ))}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Your Usage</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Videos Created</p>
            <p className="text-2xl font-bold">3</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Videos Remaining</p>
            <p className="text-2xl font-bold">27</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-2xl font-bold">Free</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Renewal Date</p>
            <p className="text-2xl font-bold">-</p>
          </div>
        </div>
      </div>
    </div>
  );
}
