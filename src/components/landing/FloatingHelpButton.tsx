
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";

export function FloatingHelpButton() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`
        transition-all duration-300 ease-in-out transform
        ${isExpanded ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}
        bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4 max-w-[300px]
      `}>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Need help? Our team is here to assist you with any questions about SmartVid.
        </p>
        <Button 
          variant="default" 
          className="w-full mt-3 bg-primary hover:bg-primary/90"
          onClick={() => window.location.href = '#contact'}
        >
          Contact Support
        </Button>
      </div>

      <Button
        size="lg"
        className={`
          rounded-full w-14 h-14 shadow-lg
          transition-transform duration-300 hover:scale-110
          ${isExpanded ? 'bg-gray-200 dark:bg-gray-700' : 'bg-primary hover:bg-primary/90'}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
