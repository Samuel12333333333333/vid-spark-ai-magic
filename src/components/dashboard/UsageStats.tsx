
import { VideoProject } from "@/services/videoService";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useVideoLimits } from "@/hooks/useVideoLimits";

interface UsageStatsProps {
  recentProjects: VideoProject[];
}

export function UsageStats({ recentProjects }: UsageStatsProps) {
  const { user } = useAuth();
  const { hasActiveSubscription, isPro, isBusiness } = useSubscription();
  const { usageCount, maxVideosPerMonth, resetDate } = useVideoLimits();
  
  const [planInfo, setPlanInfo] = useState({
    plan: "Free",
    videosCreated: 0,
    videosRemaining: 2,
    renewalDate: "-"
  });

  useEffect(() => {
    // Determine plan name
    let planName = "Free";
    if (hasActiveSubscription) {
      planName = isPro ? "Pro" : isBusiness ? "Business" : "Free";
    }
    
    // Calculate usage stats based on subscription tier
    const videosLimit = hasActiveSubscription 
      ? isPro 
        ? 20 
        : isBusiness 
          ? 50 
          : 2 // Free tier
      : 2; // Default to free
    
    // Use the calculated values or fallback to the ones from useVideoLimits
    const videosCreated = usageCount || recentProjects.length;
    const videosRemaining = Math.max(0, videosLimit - videosCreated);
    const renewalDate = resetDate ? resetDate.toLocaleDateString() : "-";
    
    setPlanInfo({
      plan: planName,
      videosCreated,
      videosRemaining,
      renewalDate
    });
  }, [recentProjects, user, hasActiveSubscription, isPro, isBusiness, usageCount, maxVideosPerMonth, resetDate]);

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
          <p className="text-sm text-muted-foreground">
            {hasActiveSubscription ? "Renewal Date" : "Upgrade to Pro"}
          </p>
          <p className="text-2xl font-bold">{planInfo.renewalDate}</p>
        </div>
      </div>
    </div>
  );
}
