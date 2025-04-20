
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, X } from "lucide-react";
import { aiService } from "@/services/aiService";
import { useToast } from "@/components/ui/use-toast";

// Define FAQ responses for quick matching
const FAQ_RESPONSES: Record<string, string> = {
  "what is smartvid": "SmartVid is a short-form video generation platform that turns your text prompts into visually engaging videos using AI and stock video clips. Perfect for creators, marketers, educators, and startups!",
  "how does it work": "SmartVid works in 3 simple steps: 1) You enter a text prompt describing your video idea, 2) Our AI breaks it down into scenes and finds matching stock footage, 3) Everything is assembled into a professional video ready to download or share!",
  "how much does it cost": "SmartVid offers a free tier with 1 video per day. For more videos and premium features, we have subscription plans starting at $9.99/month. Check out our Pricing page for details!",
  "what can i create": "You can create explainer videos, social media content, educational clips, product demos, testimonials, advertisements, and much more! Our platform is versatile for various video needs.",
  "how long are the videos": "SmartVid generates short-form videos typically ranging from 15 seconds to 2 minutes, perfect for social media and quick content consumption.",
  "where does the footage come from": "We use high-quality stock videos from Pexels that our AI automatically selects based on your prompt.",
};

// Helper function to find the best matching FAQ response
const findFAQResponse = (message: string): string | null => {
  const normalizedMessage = message.toLowerCase();
  
  // Check for direct matches first
  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    if (normalizedMessage.includes(key)) {
      return response;
    }
  }
  
  // Check for partial keyword matches
  if (normalizedMessage.includes("pricing") || normalizedMessage.includes("cost") || normalizedMessage.includes("price")) {
    return FAQ_RESPONSES["how much does it cost"];
  }
  
  if (normalizedMessage.includes("create") || normalizedMessage.includes("make") || normalizedMessage.includes("generate")) {
    return FAQ_RESPONSES["what can i create"];
  }
  
  if (normalizedMessage.includes("video length") || normalizedMessage.includes("duration")) {
    return FAQ_RESPONSES["how long are the videos"];
  }
  
  return null;
};

type Message = {
  text: string;
  isUser: boolean;
};

export function ChatBubble() {
  // Get session storage key
  const STORAGE_KEY = "smartvid-chat-history";
  
  // States
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Message[]>(() => {
    // Try to load conversation from sessionStorage
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Hooks
  const { toast } = useToast();
  
  // Save conversation to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
  }, [conversation]);
  
  // Scroll to bottom whenever conversation updates
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);
  
  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isExpanded && 
        chatWindowRef.current && 
        !chatWindowRef.current.contains(event.target as Node)
      ) {
        // Check if the click is on the toggle button (don't close if it is)
        const toggleButton = document.getElementById('chat-toggle-button');
        if (!toggleButton?.contains(event.target as Node)) {
          setIsExpanded(false);
        }
      }
    };
    
    // Handle escape key to close
    const handleEscKey = (event: KeyboardEvent) => {
      if (isExpanded && event.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isExpanded]);
  
  // Focus input when chat window opens
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isExpanded]);
  
  // Greeting message when opening empty chat
  useEffect(() => {
    if (isExpanded && conversation.length === 0) {
      setConversation([
        { 
          text: "👋 Hi there! I'm your SmartVid assistant. How can I help you today?", 
          isUser: false 
        }
      ]);
    }
  }, [isExpanded, conversation.length]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const userMessage = message.trim();
    setMessage('');
    setConversation(prev => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);
    
    try {
      // First check if we have a FAQ match
      const faqResponse = findFAQResponse(userMessage);
      
      if (faqResponse) {
        // Use the FAQ response
        setTimeout(() => {
          setConversation(prev => [...prev, { text: faqResponse, isUser: false }]);
          setIsLoading(false);
        }, 500); // Small delay to make it feel more natural
      } else {
        // Fallback to AI service
        try {
          const response = await aiService.generateScenes(userMessage);
          const aiResponse = response[0]?.description || 
            "I'm here to help you with any questions about SmartVid! Feel free to ask about how our video generator works, pricing, or features.";
          setConversation(prev => [...prev, { text: aiResponse, isUser: false }]);
        } catch (error) {
          console.error("Error from AI service:", error);
          setConversation(prev => [...prev, { 
            text: "I apologize, I'm having trouble responding right now. Please try asking about our main features or pricing instead.",
            isUser: false 
          }]);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Chat assistant error:", error);
      setConversation(prev => [...prev, { 
        text: "I apologize, I'm having trouble responding right now. Please try again.",
        isUser: false 
      }]);
      toast({
        title: "Chat Error",
        description: "There was a problem with the chat service. Please try again later.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  const clearConversation = () => {
    setConversation([
      { 
        text: "Chat history cleared. How can I help you today?", 
        isUser: false 
      }
    ]);
  };

  return (
    <>
      {/* Chat Window */}
      <div 
        ref={chatWindowRef}
        className={`
          transition-all duration-300 ease-in-out transform origin-bottom-right
          ${isExpanded 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
          }
          bg-white dark:bg-gray-900 backdrop-blur-lg
          border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl
          p-4 mb-4 w-[350px] sm:w-[380px] max-h-[500px] flex flex-col
        `}
      >
        {/* Chat Header */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white">SmartVid Assistant</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={clearConversation}
          >
            Clear chat
          </Button>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
          {conversation.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[85%] p-3 rounded-lg
                ${msg.isUser 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-gray-100 dark:bg-gray-800 rounded-tl-none'}
                shadow-sm
              `}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Typing...</span>
              </div>
            </div>
          )}
          
          {/* Invisible element to scroll to */}
          <div ref={messageEndRef} />
        </div>
        
        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about SmartVid..."
            className="flex-1 p-3 rounded-lg border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || !message.trim()}
            className="rounded-full bg-primary hover:bg-primary-dark transition-colors"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
      
      {/* Chat Button */}
      <Button
        id="chat-toggle-button"
        size="lg"
        className={`
          rounded-full w-14 h-14
          transition-all duration-300 ease-in-out
          hover:scale-110 active:scale-95
          shadow-lg
          ${isExpanded 
            ? 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700' 
            : 'bg-primary hover:bg-primary/90'}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? "Close chat" : "Open chat"}
      >
        {isExpanded ? (
          <X className="h-6 w-6 text-gray-900 dark:text-gray-100" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </Button>
    </>
  );
}
