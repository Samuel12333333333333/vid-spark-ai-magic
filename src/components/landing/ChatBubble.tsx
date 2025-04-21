import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, X } from "lucide-react";
import { aiService } from "@/services/aiService";
import { useToast } from "@/components/ui/use-toast";

const FAQ_RESPONSES: Record<string, string> = {
  "what is smartvid": "SmartVid is a short-form video generation platform that turns your text prompts into visually engaging videos using AI and stock video clips. Perfect for creators, marketers, educators, and startups!",
  "how does it work": "SmartVid works in 3 simple steps: 1) You enter a text prompt describing your video idea, 2) Our AI breaks it down into scenes and finds matching stock footage, 3) Everything is assembled into a professional video ready to download or share!",
  "how much does it cost": "SmartVid offers a free tier with 1 video per day. For more videos and premium features, we have subscription plans starting at $9.99/month. Check out our Pricing page for details!",
  "what can i create": "You can create explainer videos, social media content, educational clips, product demos, testimonials, advertisements, and much more! Our platform is versatile for various video needs.",
  "how long are the videos": "SmartVid generates short-form videos typically ranging from 15 seconds to 2 minutes, perfect for social media and quick content consumption.",
  "where does the footage come from": "We use high-quality stock videos from Pexels that our AI automatically selects based on your prompt.",
};

const findFAQResponse = (message: string): string | null => {
  const normalizedMessage = message.toLowerCase();
  
  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    if (normalizedMessage.includes(key)) {
      return response;
    }
  }
  
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
  const STORAGE_KEY = "smartvid-chat-history";
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
  }, [conversation]);
  
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isExpanded && 
        chatWindowRef.current && 
        !chatWindowRef.current.contains(event.target as Node)
      ) {
        const toggleButton = document.getElementById('chat-toggle-button');
        if (!toggleButton?.contains(event.target as Node)) {
          setIsExpanded(false);
        }
      }
    };
    
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
  
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isExpanded]);
  
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
    setConversation((prev) => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);
    
    try {
      const res = await fetch(
        "https://smartvid.app.n8n.cloud/webhook/f406671e-c954-4691-b39a-66c90aa2f103/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage }),
        }
      );
      if (!res.ok) {
        throw new Error("Failed to get response");
      }
      const data = await res.json();
      const responseText =
        typeof data === "string"
          ? data
          : data.reply || data.message || "Sorry, I didn't quite get that. Try again!";
      
      setConversation((prev) => [
        ...prev,
        { text: responseText, isUser: false },
      ]);
    } catch (error) {
      console.error("ChatBubble webhook error:", error);
      setConversation((prev) => [
        ...prev,
        {
          text: "Sorry, we couldn’t contact our support assistant just now. Try again shortly.",
          isUser: false,
        },
      ]);
    }
    setIsLoading(false);
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
      <div 
        ref={chatWindowRef}
        className={`
          fixed bottom-4 right-4 z-[99]
          transition-all duration-300 ease-in-out transform origin-bottom-right
          ${isExpanded 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
          }
          bg-white dark:bg-gray-900 backdrop-blur-lg
          border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl
          p-4 w-[350px] sm:w-[380px] max-h-[500px] flex flex-col
        `}
        style={{ boxShadow: "0 2px 24px 0 rgba(30,24,63,.11)" }}
      >
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
          
          <div ref={messageEndRef} />
        </div>
        
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
      
      <button
        id="chat-toggle-button"
        type="button"
        aria-label={isExpanded ? "Close chat" : "Open chat"}
        className={`
          fixed bottom-4 right-4 z-[100]
          rounded-full w-14 h-14 flex items-center justify-center
          transition-all duration-300 ease-in-out
          shadow-lg
          ${isExpanded 
            ? 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700' 
            : 'bg-primary hover:bg-primary/90'}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <X className="h-6 w-6 text-gray-900 dark:text-gray-100" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </button>
    </>
  );
}
