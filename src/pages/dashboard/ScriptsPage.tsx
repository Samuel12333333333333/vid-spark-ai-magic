
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, MessageSquare, Hash } from "lucide-react";

export default function ScriptsPage() {
  const scriptTools = [
    {
      title: "Hook Generator",
      description: "Create compelling opening hooks for your videos",
      icon: MessageSquare,
      action: "Generate Hook"
    },
    {
      title: "Full Script Generator",
      description: "Generate complete video scripts based on your niche",
      icon: FileText,
      action: "Write Script"
    },
    {
      title: "Caption Rewriter",
      description: "Optimize captions for Reels and TikTok",
      icon: MessageSquare,
      action: "Rewrite Caption"
    },
    {
      title: "Hashtag Generator",
      description: "Generate relevant hashtags for your content",
      icon: Hash,
      action: "Generate Tags"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">AI Scripts & Captions</h1>
          <p className="text-muted-foreground">
            Generate engaging scripts and captions with AI assistance
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Script
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scriptTools.map((tool, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <tool.icon className="h-5 w-5 text-primary" />
                {tool.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {tool.description}
              </p>
              <Button className="w-full">{tool.action}</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Scripts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No scripts created yet. Start by generating your first script!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
