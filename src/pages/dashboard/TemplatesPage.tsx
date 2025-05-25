
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TemplatesPage() {
  const templates = [
    {
      id: 1,
      name: "Product Showcase",
      description: "Perfect for highlighting product features",
      category: "Marketing",
      thumbnail: "/placeholder.svg"
    },
    {
      id: 2,
      name: "Social Media Story",
      description: "Vertical format for Instagram and TikTok",
      category: "Social",
      thumbnail: "/placeholder.svg"
    },
    {
      id: 3,
      name: "Educational Explainer",
      description: "Step-by-step educational content",
      category: "Education",
      thumbnail: "/placeholder.svg"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Video Templates</h1>
        <p className="text-muted-foreground">
          Choose from our collection of professional video templates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <img
                src={template.thumbnail}
                alt={template.name}
                className="w-full h-32 object-cover rounded-md mb-2"
              />
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Badge variant="outline">{template.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {template.description}
              </p>
              <Button className="w-full">Use Template</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
