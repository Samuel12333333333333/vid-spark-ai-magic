
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateFilters } from "@/components/templates/TemplateFilters";
import { TemplateList } from "@/components/templates/TemplateList";
import type { Template } from "@/types/template";
import { templateService } from "@/services/templateService";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    async function loadTemplates() {
      try {
        setIsLoading(true);
        const data = await templateService.getTemplates();
        setTemplates(data);
      } catch (error) {
        console.error("Error loading templates:", error);
        toast.error("Failed to load templates");
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTemplates();
  }, []);

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

  const marketingTemplates = filterTemplates(templates, "marketing");
  const socialTemplates = filterTemplates(templates, "social");
  const educationTemplates = filterTemplates(templates, "education");
  const businessTemplates = filterTemplates(templates, "business");
  const allFilteredTemplates = filterTemplates(templates, "all");
  
  const handleSelectTemplate = (id: string) => {
    navigate(`/dashboard/templates/${id}`);
  };

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Video Templates | SmartVid</title>
      </Helmet>
      
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
          <TemplateList 
            templates={allFilteredTemplates} 
            viewMode={viewMode} 
            isLoading={isLoading}
            onSelectTemplate={handleSelectTemplate}
          />
        </TabsContent>
        
        <TabsContent value="marketing" className="pt-2">
          <TemplateList 
            templates={marketingTemplates} 
            viewMode={viewMode}
            isLoading={isLoading}
            onSelectTemplate={handleSelectTemplate}
          />
        </TabsContent>
        
        <TabsContent value="social" className="pt-2">
          <TemplateList 
            templates={socialTemplates} 
            viewMode={viewMode}
            isLoading={isLoading}
            onSelectTemplate={handleSelectTemplate}
          />
        </TabsContent>
        
        <TabsContent value="education" className="pt-2">
          <TemplateList 
            templates={educationTemplates} 
            viewMode={viewMode}
            isLoading={isLoading}
            onSelectTemplate={handleSelectTemplate}
          />
        </TabsContent>
        
        <TabsContent value="business" className="pt-2">
          <TemplateList 
            templates={businessTemplates} 
            viewMode={viewMode}
            isLoading={isLoading}
            onSelectTemplate={handleSelectTemplate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
