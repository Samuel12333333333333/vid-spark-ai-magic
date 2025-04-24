
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  priceId: string | null;
}

interface PricingCardProps {
  plan: PricingPlan;
  isLoading: string | null;
  onSubscribe: (plan: PricingPlan) => void;
}

export function PricingCard({ plan, isLoading, onSubscribe }: PricingCardProps) {
  return (
    <div
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
        onClick={() => onSubscribe(plan)}
        disabled={isLoading !== null}
      >
        {isLoading === plan.name ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          plan.cta
        )}
      </Button>
    </div>
  );
}
