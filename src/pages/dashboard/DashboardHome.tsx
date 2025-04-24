
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RecentProjects } from "@/components/dashboard/RecentProjects";
import { Link } from "react-router-dom";
import { Plus, ArrowRight, Loader2 } from "lucide-react";
import { videoService, VideoProject } from "@/services/videoService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PopularTemplates } from "@/components/dashboard/PopularTemplates";
import { UsageStats } from "@/components/dashboard/UsageStats";

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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-smartvid-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
      <QuickActions />

      {/* Templates Section */}
      <PopularTemplates templates={templates} />

      {/* Usage Stats */}
      <UsageStats recentProjects={recentProjects} />
    </div>
  );
}
