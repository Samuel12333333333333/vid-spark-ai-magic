
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BlogProgressProps {
  onSubscribe?: () => void;
}

export function BlogProgress({ onSubscribe }: BlogProgressProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress as a percentage
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const progress = Math.min((window.scrollY / totalHeight) * 100, 100);
      setScrollProgress(progress);
      
      // Show CTA once we hit 75% of the article
      if (progress >= 75 && !showCta) {
        setShowCta(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showCta]);

  const handleSubscribe = () => {
    // In a real app, this would open a subscription form
    toast.success("Thanks for subscribing!");
    if (onSubscribe) onSubscribe();
  };

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      {/* Progress Bar */}
      <motion.div 
        className="h-1 bg-primary"
        style={{ width: `${scrollProgress}%` }}
        initial={{ width: "0%" }}
        animate={{ width: `${scrollProgress}%` }}
        transition={{ type: "tween" }}
      />
      
      {/* Smart CTA */}
      {showCta && (
        <motion.div 
          className="fixed bottom-6 right-6 bg-card border shadow-lg rounded-lg p-4 max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h4 className="font-bold mb-2">Enjoying this article?</h4>
          <p className="text-muted-foreground text-sm mb-3">
            Subscribe to our newsletter for more content like this!
          </p>
          <div className="flex space-x-2">
            <Button onClick={handleSubscribe} size="sm">
              Subscribe
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCta(false)}
            >
              Maybe later
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
