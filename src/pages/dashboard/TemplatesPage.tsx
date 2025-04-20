
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTemplates } from "@/hooks/useTemplates";
import { TemplateFilters } from "@/components/templates/TemplateFilters";
import { TemplateList } from "@/components/templates/TemplateList";
import type { Template } from "@/types/template";

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { data: allTemplates = [], isLoading } = useTemplates();

  // Filter templates based on search query
  const filterTemplates = (templates: Template[], category: string) => {
    return templates.filter(template => {
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
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
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Video Templates
        </h1>
        <p className="text-muted-foreground">
          Start with a pre-designed template to create your video faster
        </p>
      </div>

      <TemplateFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="pt-2">
          <TemplateList templates={allFilteredTemplates} viewMode={viewMode} />
        </TabsContent>
        
        <TabsContent value="marketing" className="pt-2">
          <TemplateList templates={marketingTemplates} viewMode={viewMode} />
        </TabsContent>
        
        <TabsContent value="social" className="pt-2">
          <TemplateList templates={socialTemplates} viewMode={viewMode} />
        </TabsContent>
        
        <TabsContent value="education" className="pt-2">
          <TemplateList templates={educationTemplates} viewMode={viewMode} />
        </TabsContent>
        
        <TabsContent value="business" className="pt-2">
          <TemplateList templates={businessTemplates} viewMode={viewMode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
