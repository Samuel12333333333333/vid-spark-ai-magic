
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { TemplateCard } from "@/components/dashboard/TemplateCard";

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for templates
  const allTemplates = [
    {
      id: "t1",
      name: "Product Showcase",
      description: "Highlight your product features in a clean, professional format.",
      thumbnail: "/placeholder.svg",
      category: "Marketing",
    },
    {
      id: "t2",
      name: "Social Media Story",
      description: "Engaging vertical format optimized for Instagram and TikTok.",
      thumbnail: "/placeholder.svg",
      category: "Social",
    },
    {
      id: "t3",
      name: "Educational Explainer",
      description: "Clear step-by-step format to explain complex concepts.",
      thumbnail: "/placeholder.svg",
      category: "Education",
    },
    {
      id: "t4",
      name: "Company Overview",
      description: "Professional template to introduce your business and services.",
      thumbnail: "/placeholder.svg",
      category: "Business",
    },
    {
      id: "t5",
      name: "Interview Style",
      description: "Format with text overlays perfect for interviews and testimonials.",
      thumbnail: "/placeholder.svg",
      category: "Marketing",
    },
    {
      id: "t6",
      name: "Product Unboxing",
      description: "Showcase your product's unboxing experience with this template.",
      thumbnail: "/placeholder.svg",
      category: "Marketing",
    },
    {
      id: "t7",
      name: "Motivational Quote",
      description: "Stylish template for sharing motivational quotes and tips.",
      thumbnail: "/placeholder.svg",
      category: "Social",
    },
    {
      id: "t8",
      name: "Step-by-Step Tutorial",
      description: "Clear instruction format for tutorials and how-to videos.",
      thumbnail: "/placeholder.svg",
      category: "Education",
    },
    {
      id: "t9",
      name: "News Update",
      description: "Professional format for delivering news and updates.",
      thumbnail: "/placeholder.svg",
      category: "Business",
    },
  ];

  // Filter templates based on search query and category
  const filterTemplates = (templates: typeof allTemplates, category: string) => {
    return templates.filter(template => {
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = category === "all" || template.category.toLowerCase() === category.toLowerCase();
      
      return matchesSearch && matchesCategory;
    });
  };

  const marketingTemplates = filterTemplates(allTemplates, "marketing");
  const socialTemplates = filterTemplates(allTemplates, "social");
  const educationTemplates = filterTemplates(allTemplates, "education");
  const businessTemplates = filterTemplates(allTemplates, "business");
  const allFilteredTemplates = filterTemplates(allTemplates, "all");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Video Templates</h1>
        <p className="text-muted-foreground">
          Start with a pre-designed template to create your video faster
        </p>
      </div>

      <div className="flex justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search templates..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="pt-6">
          {allFilteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allFilteredTemplates.map((template) => (
                <TemplateCard key={template.id} {...template} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No templates found matching your search</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="marketing" className="pt-6">
          {marketingTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketingTemplates.map((template) => (
                <TemplateCard key={template.id} {...template} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No marketing templates found matching your search</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="social" className="pt-6">
          {socialTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {socialTemplates.map((template) => (
                <TemplateCard key={template.id} {...template} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No social media templates found matching your search</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="education" className="pt-6">
          {educationTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {educationTemplates.map((template) => (
                <TemplateCard key={template.id} {...template} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No education templates found matching your search</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="business" className="pt-6">
          {businessTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businessTemplates.map((template) => (
                <TemplateCard key={template.id} {...template} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No business templates found matching your search</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
