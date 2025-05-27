
import { VideoGenerator } from "@/components/dashboard/VideoGenerator";

export default function GeneratorPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI Video Generator</h1>
        <p className="text-muted-foreground">
          Turn your text into engaging videos with AI
        </p>
      </div>

      <VideoGenerator />
    </div>
  );
}
