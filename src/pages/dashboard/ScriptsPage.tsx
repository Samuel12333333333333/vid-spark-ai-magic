
import { AIScriptGenerator } from "@/components/dashboard/AIScriptGenerator";

export default function ScriptsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI Scripts & Captions</h1>
        <p className="text-muted-foreground">
          Generate engaging scripts and captions with AI assistance
        </p>
      </div>

      <AIScriptGenerator />
    </div>
  );
}
