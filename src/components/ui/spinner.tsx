
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: number;
}

export const Spinner = ({ className, size = 24 }: SpinnerProps) => {
  return (
    <Loader2 
      className={cn("animate-spin", className)} 
      size={size} 
      aria-label="Loading" 
    />
  );
};
