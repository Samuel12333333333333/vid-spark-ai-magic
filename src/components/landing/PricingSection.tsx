import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PricingCard, PricingPlan } from "./PricingCard";
import { Spinner } from "@/components/ui/spinner";

// Define default pricing plans to use when no data is fetched
const defaultPricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for getting started with AI video creation.",
    features: [
      "5 videos per month",
      "720p video quality",
      "Basic AI-generated scenes",
      "Limited stock footage access",
      "Standard support"
    ],
    cta: "Get Started",
    popular: false,
    priceId: null
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For creators who need more videos and higher quality.",
    features: [
      "30 videos per month",
      "1080p video quality",
      "Advanced AI scene generation",
      "Full stock footage library access",
      "Priority support",
      "Custom branding"
    ],
    cta: "Subscribe Now",
    popular: true,
    priceId: "price_pro123"
  },
  {
    name: "Business",
    price: "$99",
    period: "/month",
    description: "For teams and businesses with high-volume needs.",
    features: [
      "Unlimited videos",
      "4K video quality",
      "Advanced AI scene generation",
      "Full stock footage library access",
      "Premium support",
      "Custom branding",
      "Team collaboration"
    ],
    cta: "Contact Sales",
    popular: false,
    priceId: "price_business456"
  }
];

export function PricingSection() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(defaultPricingPlans);

  useEffect(() => {
    // Note: Since we don't have a pricing_plans table in Supabase yet,
    // we're using the default plans defined above.
    // This is intentional and will be replaced once a proper pricing_plans table is set up.
    console.log("Using default pricing plans until pricing_plans table is available");
  }, []);

  const handleSubscription = async (plan: PricingPlan) => {
    if (!session) {
      setShowLoginDialog(true);
      return;
    }

    if (!plan.priceId) {
      // For free plan, just redirect to dashboard
      window.location.href = "/dashboard";
      return;
    }

    try {
      setIsLoading(plan.name);

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
      setIsLoading(null);
    }
  };

  return (
    <section id="pricing" className="py-12 md:py-24 lg:py-32 bg-smartvid-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Choose the plan that's right for you and start creating amazing videos today.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:gap-8 mt-12">
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              isLoading={isLoading}
              onSubscribe={handleSubscription}
            />
          ))}
        </div>
      </div>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in to continue</DialogTitle>
            <DialogDescription>
              You need to be signed in to subscribe to a plan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-4 mt-4">
            <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
              Cancel
            </Button>
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
