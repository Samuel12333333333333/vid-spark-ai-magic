
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Subscription } from "@/types/supabase";

interface SubscriptionContextType {
  hasActiveSubscription: boolean;
  subscription: Subscription | null;
  isPro: boolean;
  isBusiness: boolean;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  hasActiveSubscription: false,
  subscription: null,
  isPro: false,
  isBusiness: false,
  isLoading: true,
  refreshSubscription: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState(0);

  const checkSubscription = async () => {
    if (!session) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    // Rate limit checks to prevent too many API calls
    const now = Date.now();
    const minTimeBetweenChecks = 30000; // 30 seconds
    
    if (now - lastCheckTime < minTimeBetweenChecks) {
      console.log("Skipping subscription check - checked recently");
      return;
    }
    
    setLastCheckTime(now);

    try {
      setIsLoading(true);
      console.log("Checking subscription status...");
      
      // First check if we have a subscription in the database using maybeSingle() instead of single()
      const { data: dbSubscription, error: dbError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();
        
      // If we find an active subscription in the database, use it
      if (dbSubscription && !dbError) {
        console.log("Active subscription found in database:", dbSubscription);
        setSubscription(dbSubscription);
        setIsLoading(false);
        return;
      }
      
      try {
        // If no active subscription in DB or there was an error, use our check-subscription function
        const { data, error } = await supabase.functions.invoke("check-subscription");
  
        if (error) {
          console.error("Error checking subscription:", error);
          setIsLoading(false);
          return;
        }
  
        setSubscription(data.subscription);
        console.log("Subscription data updated:", data.subscription);
      } catch (funcError) {
        console.error("Error invoking check-subscription function:", funcError);
        // Fallback to checking the database for any subscription
        const { data: anySubscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (anySubscription) {
          setSubscription(anySubscription);
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      toast.error("Failed to check subscription status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
    
    // Set up periodic checks every 5 minutes
    const interval = setInterval(() => {
      checkSubscription();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [session]);
  
  // Set up subscription to the subscriptions table for real-time updates
  useEffect(() => {
    if (!session?.user.id) return;
    
    const channel = supabase
      .channel('subscription-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'subscriptions',
          filter: `user_id=eq.${session.user.id}` 
        },
        (payload) => {
          console.log('Subscription change detected:', payload);
          // Refresh subscription data when there's a change
          checkSubscription();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user.id]);

  // Determine if user has pro or business plan
  const hasActiveSubscription = !!subscription && subscription.status === "active";
  const isPro = hasActiveSubscription && subscription?.plan_name?.toLowerCase() === "pro";
  const isBusiness = hasActiveSubscription && subscription?.plan_name?.toLowerCase() === "business";

  return (
    <SubscriptionContext.Provider
      value={{
        hasActiveSubscription,
        subscription,
        isPro,
        isBusiness,
        isLoading,
        refreshSubscription: checkSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
