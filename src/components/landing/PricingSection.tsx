
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function PricingSection() {
  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      description: "Great for trying out SmartVid",
      features: [
        "1 video per day",
        "720p video quality",
        "30-second videos",
        "Basic templates",
        "Standard generation speed",
        "Watermarked videos",
      ],
      cta: "Get Started",
      popular: false,
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
      cta: "Upgrade to Pro",
      popular: true,
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
      cta: "Contact Sales",
      popular: false,
    },
  ];

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
            <div
              key={plan.name}
              className={`flex flex-col rounded-lg border bg-white p-6 shadow-lg dark:bg-gray-950 dark:border-gray-800 ${
                plan.popular
                  ? "border-smartvid-600 dark:border-smartvid-600 ring-2 ring-smartvid-600"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              {plan.popular && (
                <div className="px-3 py-1 text-sm font-medium text-white bg-smartvid-600 rounded-full inline-block self-start mb-4">
                  Most Popular
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="ml-1 text-gray-500 dark:text-gray-400">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
              </div>
              <ul className="mt-6 mb-6 space-y-2 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-smartvid-600" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={
                  plan.popular
                    ? "bg-smartvid-600 hover:bg-smartvid-700"
                    : plan.name === "Free"
                    ? "bg-smartvid-600 hover:bg-smartvid-700"
                    : "bg-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700"
                }
                asChild
              >
                <Link to={plan.name === "Free" ? "/register" : "/contact"}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
