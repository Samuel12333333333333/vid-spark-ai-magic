
import { useState, useEffect } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function UpgradePage() {
  const { hasActiveSubscription, subscription, isPro, isBusiness, isLoading, refreshSubscription } = useSubscription();
  const { session } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Refresh subscription data when component mounts
    refreshSubscription();
  }, [refreshSubscription]);

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Great for trying out SmartVid",
      features: [
        "1 video per day",
        "720p video quality",
        "30-second videos",
        "Basic templates",
        "Standard generation speed",
        "Watermarked videos",
      ],
      current: !hasActiveSubscription,
      priceId: null,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "Perfect for content creators",
      features: [
        "30 videos per month",
        "1080p video quality",
        "2-minute videos",
        "All templates",
        "Priority generation",
        "No watermarks",
        "Custom branding",
        "Basic AI voiceover",
      ],
      current: isPro,
      priceId: "price_1OoGc4QOvLVQwvg3rZZKVVP3", // Updated price ID for Pro plan
    },
    {
      name: "Business",
      price: "$99",
      period: "/month",
      description: "For teams and businesses",
      features: [
        "Unlimited videos",
        "4K video quality",
        "5-minute videos",
        "Custom templates",
        "Express generation",
        "No watermarks",
        "Custom branding",
        "Premium AI voiceover",
        "Team collaboration",
        "API access",
      ],
      current: isBusiness,
      priceId: "price_1OoGcTQOvLVQwvg3wgqYXNlx", // Updated price ID for Business plan
    },
  ];

  const handleSubscription = async (plan) => {
    if (!plan.priceId) {
      toast.info("You're already on the free plan");
      return;
    }

    if (plan.current) {
      toast.info(`You're already subscribed to the ${plan.name} plan`);
      return;
    }

    try {
      setCheckoutLoading(plan.name);
      console.log("Creating checkout for plan:", plan.name, "with priceId:", plan.priceId);
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId: plan.priceId,
          plan: plan.name.toLowerCase(),
        },
      });

      if (error) {
        console.error("Checkout error:", error);
        toast.error("Failed to start checkout process. Please try again.");
        throw error;
      }

      if (!data || !data.url) {
        console.error("No checkout URL returned");
        toast.error("Failed to create checkout session. Please try again.");
        return;
      }

      // Redirect to Stripe Checkout
      console.log("Redirecting to checkout:", data.url);
      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Failed to start checkout process. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-smartvid-600" />
        <span className="ml-2 text-lg">Loading subscription data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upgrade Your Plan</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Choose the plan that's right for you and take your video creation to the next level.
        </p>
      </div>

      {subscription && (
        <Card className="mb-8 border-smartvid-600/30 bg-smartvid-50/30 dark:bg-smartvid-950/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
              Current Subscription
            </CardTitle>
            <CardDescription>
              {hasActiveSubscription
                ? `You're currently on the ${subscription.plan_name} plan`
                : "You're currently on the Free plan"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasActiveSubscription && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Status: <span className="font-medium text-green-600">{subscription.status}</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Renews:{" "}
                  <span className="font-medium">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refreshSubscription()}
              className="mr-2"
            >
              Refresh Status
            </Button>
            {hasActiveSubscription && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    const { data, error } = await supabase.functions.invoke("customer-portal");
                    if (error) throw error;
                    if (data?.url) window.location.href = data.url;
                  } catch (error) {
                    console.error("Error accessing customer portal:", error);
                    toast.error("Couldn't open customer portal. Please try again.");
                  }
                }}
              >
                Manage Subscription
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`flex flex-col h-full ${
              plan.current
                ? "border-smartvid-600 dark:border-smartvid-600 ring-2 ring-smartvid-600"
                : ""
            }`}
          >
            <CardHeader>
              {plan.current && (
                <div className="px-3 py-1 text-sm font-medium text-white bg-smartvid-600 rounded-full inline-block self-start mb-2">
                  Current Plan
                </div>
              )}
              <CardTitle>{plan.name}</CardTitle>
              <div className="flex items-baseline mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="ml-1 text-gray-500 dark:text-gray-400">{plan.period}</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-smartvid-600" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className={`w-full ${
                  plan.current
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    : "bg-smartvid-600 hover:bg-smartvid-700"
                }`}
                onClick={() => handleSubscription(plan)}
                disabled={checkoutLoading !== null || plan.current}
              >
                {checkoutLoading === plan.name ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : plan.current ? (
                  "Current Plan"
                ) : hasActiveSubscription ? (
                  "Switch Plan"
                ) : (
                  "Upgrade"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
