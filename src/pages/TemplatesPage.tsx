
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default function TemplatesPage() {
  const templates = [
    {
      id: 1,
      name: "Product Launch",
      description: "Perfect template for announcing new products",
      category: "Marketing",
      thumbnail: "/placeholder.svg",
      duration: "30s"
    },
    {
      id: 2,
      name: "Educational Tutorial",
      description: "Step-by-step tutorial template with clear sections",
      category: "Education",
      thumbnail: "/placeholder.svg",
      duration: "60s"
    },
    {
      id: 3,
      name: "Social Media Story",
      description: "Vertical format optimized for Instagram and TikTok",
      category: "Social",
      thumbnail: "/placeholder.svg",
      duration: "15s"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Video Templates</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose from our collection of professionally designed templates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="aspect-video bg-gray-100 rounded-md mb-4 flex items-center justify-center">
                <Play className="h-8 w-8 text-gray-400" />
              </div>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Badge variant="outline">{template.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {template.description}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Duration: {template.duration}
              </p>
              <Button className="w-full">Use Template</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
