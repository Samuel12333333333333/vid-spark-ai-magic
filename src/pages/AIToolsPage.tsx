import { ExternalLink, Sparkles, FileText, Wand2, Shield, Languages, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SEOMetadata from "@/components/SEOMetadata";

interface AITool {
  name: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  url: string;
  appUrl?: string;
  badge?: string;
  category: string;
}

const aiTools: AITool[] = [
  {
    name: "AI Free Text Pro",
    description: "Detect AI-generated content and humanize your text to bypass AI detectors. Perfect for making your scripts and content appear more natural and human-written.",
    features: [
      "AI Content Detection",
      "Text Humanization",
      "Bypass AI Detectors",
      "Multiple Language Support",
      "Bulk Processing"
    ],
    icon: <Sparkles className="h-8 w-8" />,
    url: "https://aifreetextpro.com",
    appUrl: "https://app.aifreetextpro.com",
    badge: "Featured Partner",
    category: "Content & Text"
  },
  {
    name: "Smart Video AI",
    description: "Transform your ideas into engaging short-form videos instantly. Use AI to generate scripts, find stock footage, and render professional videos.",
    features: [
      "AI Script Generation",
      "Stock Video Integration",
      "Text Overlays & Captions",
      "Multiple Video Styles",
      "Quick Rendering"
    ],
    icon: <Wand2 className="h-8 w-8" />,
    url: "/",
    badge: "You are here",
    category: "Video Creation"
  }
];

const useCases = [
  {
    title: "Content Creators",
    description: "Generate video scripts with Smart Video, then humanize them with AI Free Text Pro to ensure your content feels authentic and passes AI detection.",
    icon: <FileText className="h-6 w-6" />
  },
  {
    title: "Marketers",
    description: "Create compelling ad copy and video content that resonates with audiences while maintaining a natural, human touch.",
    icon: <MessageSquare className="h-6 w-6" />
  },
  {
    title: "Educators",
    description: "Develop educational video content with AI assistance, then refine the scripts to sound more conversational and engaging.",
    icon: <Languages className="h-6 w-6" />
  },
  {
    title: "Businesses",
    description: "Scale your content production while ensuring all AI-assisted content maintains brand authenticity and passes quality checks.",
    icon: <Shield className="h-6 w-6" />
  }
];

const AIToolsPage = () => {
  return (
    <>
      <SEOMetadata
        title="AI Tools - Partner Ecosystem | Smart Video"
        description="Discover our ecosystem of AI tools for content creation, text humanization, and video generation. Explore partner tools to enhance your workflow."
        keywords="AI tools, AI detector, text humanizer, video generator, content creation, AI ecosystem"
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4">
              AI Ecosystem
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Powerful AI Tools for
              <span className="text-primary block mt-2">Content Creators</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Explore our ecosystem of AI-powered tools designed to help you create, 
              refine, and optimize your content. From video generation to text humanization.
            </p>
          </div>
        </section>

        {/* AI Tools Grid */}
        <section className="py-16 container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our AI Tools</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover the tools that power modern content creation workflows
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {aiTools.map((tool) => (
              <Card key={tool.name} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                {tool.badge && (
                  <Badge 
                    className="absolute top-4 right-4"
                    variant={tool.badge === "Featured Partner" ? "default" : "secondary"}
                  >
                    {tool.badge}
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      {tool.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{tool.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">{tool.category}</Badge>
                    </div>
                  </div>
                  <CardDescription className="text-base mt-4">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                      Key Features
                    </h4>
                    <ul className="grid grid-cols-1 gap-2">
                      {tool.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex gap-3">
                    {tool.url.startsWith("http") ? (
                      <>
                        <Button asChild className="flex-1">
                          <a href={tool.url} target="_blank" rel="noopener noreferrer">
                            Visit Website
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                        {tool.appUrl && (
                          <Button asChild variant="outline" className="flex-1">
                            <a href={tool.appUrl} target="_blank" rel="noopener noreferrer">
                              Open App
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button asChild variant="secondary" className="flex-1">
                        <a href={tool.url}>
                          Explore Features
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Use Cases</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                See how our AI tools work together to solve real-world content challenges
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {useCases.map((useCase) => (
                <Card key={useCase.title} className="text-center hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="mx-auto p-3 rounded-full bg-primary/10 text-primary w-fit mb-2">
                      {useCase.icon}
                    </div>
                    <CardTitle className="text-lg">{useCase.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {useCase.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 container mx-auto px-4">
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20 max-w-4xl mx-auto">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to Supercharge Your Content?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Combine the power of AI video generation with text humanization to create 
                authentic, engaging content at scale.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <a href="/dashboard/generator">
                    Start Creating Videos
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="https://app.aifreetextpro.com" target="_blank" rel="noopener noreferrer">
                    Try AI Free Text Pro
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
};

export default AIToolsPage;
