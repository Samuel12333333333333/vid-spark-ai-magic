
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles } from "lucide-react";

export default function IntegrationsPage() {
  const integrations = [
    {
      name: "AI Free Text Pro",
      description: "Detect AI content and humanize your scripts - perfect for making your generated content undetectable",
      logo: "/placeholder.svg",
      status: "Available",
      external: true,
      href: "https://aifreetextpro.com"
    },
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
          <Card key={index} className={integration.name === 'AI Free Text Pro' ? 'border-primary/50 bg-primary/5' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${integration.name === 'AI Free Text Pro' ? 'bg-primary/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    {integration.name === 'AI Free Text Pro' ? (
                      <Sparkles className="h-4 w-4 text-primary" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                  </div>
                  {integration.name}
                  {integration.name === 'AI Free Text Pro' && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Partner</span>
                  )}
                </div>
                <span className={`text-sm px-2 py-1 rounded ${
                  integration.status === 'Available' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {integration.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{integration.description}</p>
              {integration.external ? (
                <Button 
                  className="w-full" 
                  asChild
                >
                  <a href={integration.href} target="_blank" rel="noopener noreferrer">
                    Visit AI Free Text Pro
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  disabled={integration.status === 'Coming Soon'}
                >
                  {integration.status === 'Available' ? 'Connect' : 'Coming Soon'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
