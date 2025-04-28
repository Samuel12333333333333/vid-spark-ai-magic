import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoUsageResponse {
  count: number;
  reset_at: string;
}

const getDefaultResetDate = () =>
  new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

export function useVideoLimits() {
  const [usageCount, setUsageCount] = useState<number>(0);
  const [resetDate, setResetDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const maxVideosPerMonth = 5; // Free tier limit

  const canGenerateVideo = usageCount < maxVideosPerMonth;
  const remainingVideos = Math.max(0, maxVideosPerMonth - usageCount);

  const checkUsage = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);

      const { data, error } = await supabase.functions.invoke<VideoUsageResponse>("get_video_usage");

      if (error) {
        console.error("Error fetching video usage:", error);
        setIsError(true);
        setUsageCount(0);
        setResetDate(getDefaultResetDate());
        return;
      }

      if (data) {
        setUsageCount(data.count);
        setResetDate(data.reset_at ? new Date(data.reset_at) : getDefaultResetDate());
      } else {
        setUsageCount(0);
        setResetDate(getDefaultResetDate());
      }
    } catch (error) {
      console.error("Unexpected error fetching video usage:", error);
      setIsError(true);
      setUsageCount(0);
      setResetDate(getDefaultResetDate());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUsage();
  }, [checkUsage]);

  const incrementUsage = useCallback(async (): Promise<boolean> => {
    if (!canGenerateVideo) {
      toast.error(
        `You've reached your limit of ${maxVideosPerMonth} videos this month. Your limit will reset on ${resetDate?.toLocaleDateString()}.`
      );
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke<VideoUsageResponse>("increment_video_usage");

      if (error) {
        console.error("Error incrementing video usage:", error);
        return false;
      }

      if (data) {
        setUsageCount(data.count);
        setResetDate(data.reset_at ? new Date(data.reset_at) : getDefaultResetDate());
      } else {
        setUsageCount((prev) => prev + 1);
      }

      return true;
    } catch (error) {
      console.error("Unexpected error incrementing video usage:", error);
      return false;
    }
  }, [canGenerateVideo, resetDate, maxVideosPerMonth]);

  const refreshUsage = useCallback(() => {
    return checkUsage();
  }, [checkUsage]);

  return {
    usageCount,
    resetDate,
    isLoading,
    isError,
    canGenerateVideo,
    remainingVideos,
    incrementUsage,
    refreshUsage,
    maxVideosPerMonth,
  };
}

