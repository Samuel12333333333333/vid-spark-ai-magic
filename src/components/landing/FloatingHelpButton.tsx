
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";

export function FloatingHelpButton() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className={`
        transition-all duration-500 ease-in-out transform origin-bottom-left
        ${isExpanded 
          ? 'scale-100 opacity-100 translate-y-0' 
          : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
        }
        bg-gradient-to-br from-background/90 to-background/50 backdrop-blur-lg
        border border-primary/20 rounded-lg shadow-lg shadow-primary/10
        p-4 mb-4 max-w-[300px]
      `}>
        <p className="text-sm text-foreground/80 animate-fade-in">
          Need help? Our team is here to assist you with any questions about SmartVid.
        </p>
        <Button 
          variant="default" 
          className="w-full mt-3 bg-primary hover:bg-primary/90 
                     transition-all duration-300 hover:scale-105 animate-scale-in"
          onClick={() => window.location.href = '#contact'}
        >
          Contact Support
        </Button>
      </div>

      <Button
        size="lg"
        className={`
          rounded-full w-14 h-14
          transition-all duration-500 ease-in-out
          hover:scale-110 active:scale-95
          shadow-lg shadow-primary/20
          animate-bounce-slow
          ${isExpanded 
            ? 'bg-background border-2 border-primary/20 rotate-180' 
            : 'bg-primary hover:bg-primary/90'}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <X className="h-6 w-6 text-primary animate-fade-in" />
        ) : (
          <MessageCircle className="h-6 w-6 animate-fade-in" />
        )}
      </Button>
    </div>
  );
}
