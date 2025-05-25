
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function GeneratorPage() {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI Video Generator</h1>
        <p className="text-muted-foreground">
          Turn your text into engaging videos with AI
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Your Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="prompt" className="text-sm font-medium mb-2 block">
              Describe your video idea
            </label>
            <Textarea
              id="prompt"
              placeholder="Example: Create a product showcase video for a new smartphone highlighting its camera features..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>
          <Button className="w-full" disabled={!prompt.trim()}>
            Generate Video
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
