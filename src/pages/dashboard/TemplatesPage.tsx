import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, LayoutGrid, LayoutList } from "lucide-react";
import { TemplateCard } from "@/components/dashboard/TemplateCard";

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  const renderTemplateGrid = (templates: typeof allTemplates) => {
    if (templates.length === 0) {
      return (
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
      );
    }

    return (
      <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
        {templates.map((template) => (
          <TemplateCard key={template.id} {...template} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Video Templates</h1>
        <p className="text-muted-foreground">
          Start with a pre-designed template to create your video faster
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search templates..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className={viewMode === "grid" ? "bg-primary/10" : ""}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={viewMode === "list" ? "bg-primary/10" : ""}
            onClick={() => setViewMode("list")}
          >
            <LayoutList className="h-4 w-4" />
            <span className="sr-only">List view</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="pt-2">
          {renderTemplateGrid(allFilteredTemplates)}
        </TabsContent>
        
        <TabsContent value="marketing" className="pt-2">
          {renderTemplateGrid(marketingTemplates)}
        </TabsContent>
        
        <TabsContent value="social" className="pt-2">
          {renderTemplateGrid(socialTemplates)}
        </TabsContent>
        
        <TabsContent value="education" className="pt-2">
          {renderTemplateGrid(educationTemplates)}
        </TabsContent>
        
        <TabsContent value="business" className="pt-2">
          {renderTemplateGrid(businessTemplates)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
