
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function IntegrationsPage() {
  const integrations = [
    {
      name: "YouTube",
      description: "Upload videos directly to your YouTube channel",
      logo: "/placeholder.svg",
      status: "Available"
    },
    {
      name: "Instagram",
      description: "Share videos to Instagram posts and stories",
      logo: "/placeholder.svg",
      status: "Available"
    },
    {
      name: "TikTok",
      description: "Post videos directly to TikTok",
      logo: "/placeholder.svg",
      status: "Coming Soon"
    },
    {
      name: "LinkedIn",
      description: "Share professional videos on LinkedIn",
      logo: "/placeholder.svg",
      status: "Available"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Integrations</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect SmartVid with your favorite platforms
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                  {integration.name}
                </div>
                <span className={`text-sm px-2 py-1 rounded ${
                  integration.status === 'Available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {integration.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{integration.description}</p>
              <Button 
                className="w-full" 
                disabled={integration.status === 'Coming Soon'}
              >
                {integration.status === 'Available' ? 'Connect' : 'Coming Soon'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
