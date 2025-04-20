
import { useState, useEffect } from 'react';
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VideoUsage {
  count: number;
  reset_at: string;
}

export function useVideoLimits() {
  const [usage, setUsage] = useState<VideoUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { subscription } = useSubscription();
  
  const getLimit = () => {
    if (!subscription) return 1; // Free tier
    switch (subscription.plan_name.toLowerCase()) {
      case 'business':
        return 100;
      case 'pro':
        return 20;
      default:
        return 1;
    }
  };

  const checkUsage = async () => {
    try {
      // Use the correct approach for RPC calls without explicit type parameters
      const { data, error: usageError } = await supabase
        .rpc('get_video_usage')
        .single();

      if (usageError) {
        if (usageError.message.includes('No rows found')) {
          // Create initial usage record if none exists
          const { data: newUsage, error: createError } = await supabase
            .rpc('initialize_video_usage');
            
          if (createError) throw createError;
          
          if (newUsage) {
            setUsage({
              count: newUsage.count || 0,
              reset_at: newUsage.reset_at || new Date().toISOString()
            });
          }
        } else {
          throw usageError;
        }
      } else if (data) {
        setUsage({
          count: data.count || 0,
          reset_at: data.reset_at || new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error checking video usage:', error);
      toast.error('Failed to check video usage limits');
    } finally {
      setIsLoading(false);
    }
  };

  const incrementUsage = async () => {
    try {
      const currentLimit = getLimit();
      
      if (!usage) {
        await checkUsage();
        return false;
      }

      // Check if usage would exceed limit
      if (usage.count >= currentLimit) {
        toast.error(`You've reached your monthly limit of ${currentLimit} videos. Please upgrade your plan for more.`);
        return false;
      }

      // Increment usage using a stored procedure
      const { data, error } = await supabase
        .rpc('increment_video_usage');

      if (error) throw error;
      
      if (data) {
        setUsage({
          count: data.count || 0,
          reset_at: data.reset_at || new Date().toISOString()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error incrementing video usage:', error);
      toast.error('Failed to update video usage');
      return false;
    }
  };

  useEffect(() => {
    checkUsage();
  }, []);

  return {
    usage,
    isLoading,
    currentLimit: getLimit(),
    remainingVideos: usage ? Math.max(0, getLimit() - usage.count) : 0,
    canGenerateVideo: usage ? usage.count < getLimit() : false,
    incrementUsage
  };
}
