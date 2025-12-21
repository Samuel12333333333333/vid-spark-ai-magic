
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      title: "AI Script Generation",
      description: "Generate compelling video scripts from simple prompts",
      tier: "Free",
      popular: false
    },
    {
      title: "Professional Templates",
      description: "Access hundreds of professionally designed video templates",
      tier: "Pro",
      popular: true
    },
    {
      title: "HD Video Export",
      description: "Export videos in high definition quality",
      tier: "Pro",
      popular: false
    },
    {
      title: "Custom Branding",
      description: "Add your logo and brand colors to videos",
      tier: "Business",
      popular: false
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Powerful Features</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover all the tools and features that make Smart Video the best choice for video creation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="relative">
            {feature.popular && (
              <div className="absolute -top-2 left-4">
                <Badge className="bg-primary text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span>{feature.title}</span>
                <Badge variant="outline">{feature.tier}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
