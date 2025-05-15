
import { AIScriptGenerator } from "@/components/dashboard/AIScriptGenerator";
import { Helmet } from "react-helmet-async";

export default function ScriptsPage() {
  return (
    <div className="space-y-8">
      <Helmet>
        <title>AI Script Generator | SmartVid</title>
      </Helmet>
      
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Script & Caption Tools</h1>
        <p className="text-muted-foreground">
          Generate engaging scripts, hooks, captions, and hashtags for your videos
        </p>
      </div>

      <AIScriptGenerator />
    </div>
  );
}
