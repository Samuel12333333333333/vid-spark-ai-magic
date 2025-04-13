
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan_name: string;
  status: string;
  current_period_end: string;
  created_at: string;
}

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

  const checkSubscription = async () => {
    if (!session) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke("check-subscription");

      if (error) {
        console.error("Error checking subscription:", error);
        return;
      }

      setSubscription(data.subscription);
    } catch (error) {
      console.error("Error checking subscription:", error);
      toast.error("Failed to check subscription status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [session]);

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
