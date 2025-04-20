
import { useState, useEffect } from 'react';
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VideoUsage {
  count: number;
  reset_at: string;
}

type RPCResponse = {
  count: number;
  reset_at: string;
};

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
      setIsLoading(true);
      
      // Use the most basic approach for RPC calls
      const { data, error: usageError } = await supabase
        .rpc('get_video_usage')
        .single();

      if (usageError) {
        console.log("Usage error:", usageError.message);
        
        if (usageError.message.includes('No rows found') || usageError.message.includes('does not exist')) {
          console.log("No usage record found, creating initial usage");
          
          // Create initial usage record if none exists
          const { data: newUsage, error: createError } = await supabase
            .rpc('initialize_video_usage');
            
          if (createError) {
            console.error("Error initializing usage:", createError);
            throw createError;
          }
          
          if (newUsage) {
            const typedData = newUsage as unknown as RPCResponse;
            setUsage({
              count: typedData.count || 0,
              reset_at: typedData.reset_at || new Date().toISOString()
            });
          }
        } else {
          // Fall back to default values if there's an error
          console.warn("Using default usage values due to error");
          setUsage({
            count: 0,
            reset_at: new Date().toISOString()
          });
        }
      } else if (data) {
        const typedData = data as unknown as RPCResponse;
        setUsage({
          count: typedData.count || 0,
          reset_at: typedData.reset_at || new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error checking video usage:', error);
      // Don't show error toast, just use default values
      setUsage({
        count: 0,
        reset_at: new Date().toISOString()
      });
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

      if (error) {
        console.error("Error incrementing usage:", error);
        throw error;
      }
      
      if (data) {
        const typedData = data as unknown as RPCResponse;
        setUsage({
          count: typedData.count || 0,
          reset_at: typedData.reset_at || new Date().toISOString()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error incrementing video usage:', error);
      // Continue anyway despite error
      return true;
    }
  };

  useEffect(() => {
    checkUsage();
  }, []);

  return {
    usage,
    isLoading,
    currentLimit: getLimit(),
    remainingVideos: usage ? Math.max(0, getLimit() - usage.count) : getLimit(),
    canGenerateVideo: usage ? usage.count < getLimit() : true,
    incrementUsage
  };
}
