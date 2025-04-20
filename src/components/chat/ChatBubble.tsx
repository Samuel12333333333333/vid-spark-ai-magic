
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Loader } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { toast } from "sonner";

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

// Sample AI responses for demonstration
const aiResponses = [
  "Thanks for reaching out! SmartVid uses AI to transform your text into professional videos in minutes. Would you like to know more about a specific feature?",
  "Great question! You can create up to 1 video per day with our free plan. Our paid plans offer unlimited video creation along with premium features.",
  "SmartVid works by analyzing your text, breaking it into scenes, finding relevant stock footage, and generating a complete video. The whole process takes just a few minutes!",
  "You own all rights to the videos you create with SmartVid. All stock footage is licensed for commercial use, so you can use your videos anywhere.",
  "We offer a 14-day money-back guarantee on all our paid plans. You can try it risk-free!"
];

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add welcome message when chat first opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsLoading(true);
      setTimeout(() => {
        const welcomeMessage: Message = {
          content: "👋 Hi there! How can I help you with SmartVid today?",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        setIsLoading(false);
      }, 1000);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset unread messages when chat opens
  useEffect(() => {
    if (isOpen) {
      setHasUnreadMessages(false);
    }
  }, [isOpen]);

  // Auto focus textarea when chat opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      content: currentMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);
    setIsTypingAnimation(true);

    // Simulate AI thinking and typing
    const thinkingTime = 1000 + Math.random() * 2000;
    
    setTimeout(() => {
      // Select a random response
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      // Simulate typing effect
      let typingTime = randomResponse.length * 20; // 20ms per character
      typingTime = Math.min(Math.max(typingTime, 800), 3000); // Between 800ms and 3000ms
      
      setTimeout(() => {
        const aiMessage: Message = {
          content: randomResponse,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
        setIsTypingAnimation(false);
        
        // Show toast notification when chat is closed
        if (!isOpen) {
          setHasUnreadMessages(true);
          toast.info("New message from support", {
            description: "Click to view",
            action: {
              label: "Open",
              onClick: () => setIsOpen(true),
            },
          });
        }
      }, typingTime);
    }, thinkingTime);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-background border rounded-lg shadow-xl w-[350px] h-[500px] flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-primary/90 to-secondary text-white rounded-t-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-semibold">SmartVid Support</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.isUser ? "justify-end" : "justify-start",
                    "animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%] shadow-sm",
                      message.isUser
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted rounded-tl-none"
                    )}
                  >
                    {message.content}
                    <div className={cn(
                      "text-xs opacity-70 mt-1 text-right",
                      message.isUser ? "text-primary-foreground/70" : "text-foreground/70"
                    )}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-muted rounded-lg px-4 py-2 rounded-tl-none shadow-sm">
                    {isTypingAnimation ? (
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>Processing your request...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                placeholder="Type your message..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                className="min-h-[80px] resize-none focus-visible:ring-primary"
                onKeyDown={handleKeyDown}
              />
              <Button
                className="self-end bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105"
                size="icon"
                disabled={!currentMessage.trim() || isLoading}
                onClick={handleSendMessage}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <HoverCard open={isHovered} onOpenChange={setIsHovered}>
          <HoverCardTrigger asChild>
            <Button
              size="lg"
              className={cn(
                "rounded-full h-14 w-14 shadow-lg transition-all duration-300 hover:scale-110 bg-primary hover:bg-primary/90",
                hasUnreadMessages && "animate-bounce-slow"
              )}
              onClick={() => setIsOpen(true)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <MessageCircle className="h-6 w-6" />
              {hasUnreadMessages && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="bg-primary text-white border-none p-2" side="top">
            Need help? Chat with us!
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
}
