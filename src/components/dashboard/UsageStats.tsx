
import { VideoProject } from "@/services/videoService";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

interface UsageStatsProps {
  recentProjects: VideoProject[];
}

export function UsageStats({ recentProjects }: UsageStatsProps) {
  const { user } = useAuth();
  const [planInfo, setPlanInfo] = useState({
    plan: "Free",
    videosCreated: 0,
    videosRemaining: 30,
    renewalDate: "-"
  });

  useEffect(() => {
    // Calculate usage stats
    const videosCreated = recentProjects.length;
    const videosRemaining = 30 - videosCreated; // Assuming a limit of 30 videos on free plan
    
    setPlanInfo({
      plan: "Free",  // Default to free, should be updated from subscription info
      videosCreated,
      videosRemaining: videosRemaining > 0 ? videosRemaining : 0,
      renewalDate: "-"
    });
  }, [recentProjects, user]);

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Your Usage</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Videos Created</p>
          <p className="text-2xl font-bold">{planInfo.videosCreated}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Videos Remaining</p>
          <p className="text-2xl font-bold">{planInfo.videosRemaining}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Current Plan</p>
          <p className="text-2xl font-bold">{planInfo.plan}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Renewal Date</p>
          <p className="text-2xl font-bold">{planInfo.renewalDate}</p>
        </div>
      </div>
    </div>
  );
}
