
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Video, Zap, Users, TrendingUp } from "lucide-react";

export default function ProductPage() {
  const features = [
    {
      icon: Video,
      title: "AI Video Generation",
      description: "Transform text into engaging videos with our advanced AI technology"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate professional videos in minutes, not hours"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together with your team on video projects"
    },
    {
      icon: TrendingUp,
      title: "Analytics & Insights",
      description: "Track performance and optimize your video content"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Smart Video Product Overview</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Everything you need to create stunning videos with AI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <feature.icon className="h-6 w-6 text-primary" />
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button asChild size="lg">
          <Link to="/auth">Get Started</Link>
        </Button>
      </div>
    </div>
  );
}
