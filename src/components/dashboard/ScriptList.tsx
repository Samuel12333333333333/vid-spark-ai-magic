
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { aiService, ScriptType } from "@/services/aiService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Trash } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ScriptListProps {
  type?: ScriptType;
  onSelect?: (content: string) => void;
}

export function ScriptList({ type, onSelect }: ScriptListProps) {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadScripts();
    }
  }, [user, type]);

  const loadScripts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await aiService.getScripts(user.id, type);
      setScripts(data);
    } catch (error) {
      console.error("Error loading scripts:", error);
      toast.error("Failed to load scripts");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleSelect = (content: string) => {
    if (onSelect) {
      onSelect(content);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (scripts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No saved scripts found.</p>
        <p className="text-sm mt-2">
          {type ? `Scripts of type "${type}" will appear here.` : "Generate and save scripts to see them here."}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {scripts.map((script) => (
          <Card key={script.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{script.title}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">{script.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(script.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCopy(script.content)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm border-l-2 border-muted pl-3 py-1 line-clamp-3">
                {script.content}
              </div>
              {onSelect && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={() => handleSelect(script.content)}
                >
                  Use This Script
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
