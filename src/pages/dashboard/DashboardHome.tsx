
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RecentProjects } from "@/components/dashboard/RecentProjects";
import { TemplateCard } from "@/components/dashboard/TemplateCard";
import { Link } from "react-router-dom";
import { Plus, ArrowRight, Loader2 } from "lucide-react";
import { videoService, VideoProject } from "@/services/videoService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function DashboardHome() {
  const [recentProjects, setRecentProjects] = useState<VideoProject[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch recent projects
        const projects = await videoService.getRecentProjects(3);
        setRecentProjects(projects);
        
        // Fetch templates
        const { data: templateData, error } = await supabase
          .from('templates')
          .select('*')
          .limit(3);
          
        if (error) {
          throw error;
        }
        
        setTemplates(templateData || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user]);

  // Fallback templates if none exist in the database
  const fallbackTemplates = [
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

  const displayTemplates = templates.length > 0 ? templates : fallbackTemplates;

  // Calculate usage stats
  const videosCreated = recentProjects.length;
  const videosRemaining = 30 - videosCreated; // Assuming a limit of 30 videos on free plan

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-smartvid-600" />
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!</h1>
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
            {recentProjects.length > 0 ? (
              <RecentProjects projects={recentProjects} />
            ) : (
              <div className="text-center py-12 border rounded-lg">
                <p className="text-muted-foreground mb-4">You haven't created any videos yet</p>
                <Button className="bg-smartvid-600 hover:bg-smartvid-700" asChild>
                  <Link to="/dashboard/generator">Create Your First Video</Link>
                </Button>
              </div>
            )}
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
              {displayTemplates.map((template) => (
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
                <p className="text-2xl font-bold">{videosCreated}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Videos Remaining</p>
                <p className="text-2xl font-bold">{videosRemaining}</p>
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
        </>
      )}
    </div>
  );
}
