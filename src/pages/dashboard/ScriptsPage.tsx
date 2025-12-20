
import { AIScriptGenerator } from "@/components/dashboard/AIScriptGenerator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ExternalLink } from "lucide-react";

export default function ScriptsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI Scripts & Captions</h1>
        <p className="text-muted-foreground">
          Generate engaging scripts and captions with AI assistance
        </p>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Need to bypass AI detectors?</p>
              <p className="text-sm text-muted-foreground">Humanize your AI-generated scripts with AI Free Text Pro</p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <a href="https://app.aifreetextpro.com" target="_blank" rel="noopener noreferrer">
              Try AI Humanizer
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <AIScriptGenerator />
    </div>
  );
}
