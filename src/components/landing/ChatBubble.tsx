
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { aiService } from "@/services/aiService";

export function ChatBubble() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<{ text: string; isUser: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    setConversation(prev => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);

    try {
      const response = await aiService.generateScenes(userMessage);
      const aiResponse = response[0]?.description || "I'm here to help you with any questions about SmartVid!";
      setConversation(prev => [...prev, { text: aiResponse, isUser: false }]);
    } catch (error) {
      setConversation(prev => [...prev, { 
        text: "I apologize, I'm having trouble responding right now. Please try again.",
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`
        transition-all duration-500 ease-in-out transform origin-bottom-right
        ${isExpanded 
          ? 'scale-100 opacity-100 translate-y-0' 
          : 'scale-95 opacity-0 translate-y-4 pointer-events-none'
        }
        bg-white dark:bg-gray-900 backdrop-blur-lg
        border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg
        p-4 mb-4 w-[350px] max-h-[500px] flex flex-col
      `}>
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {conversation.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-[80%] p-3 rounded-lg
                ${msg.isUser 
                  ? 'bg-primary text-white ml-4' 
                  : 'bg-gray-100 dark:bg-gray-800 mr-4'}
              `}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg animate-pulse">
                Typing...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about SmartVid..."
            className="flex-1 p-2 rounded-md border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <MessageCircle className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <Button
        size="lg"
        className={`
          rounded-full w-14 h-14
          transition-all duration-500 ease-in-out
          hover:scale-110 active:scale-95
          shadow-lg
          ${isExpanded 
            ? 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rotate-180' 
            : 'bg-primary hover:bg-primary/90'}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <X className="h-6 w-6 text-gray-900 dark:text-gray-100" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </Button>
    </div>
  );
}
