
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { templateService } from "@/services/templateService";
import { Template } from "@/types/template";

interface PopularTemplatesProps {
  limit?: number;
}

export function PopularTemplates({ limit = 3 }: PopularTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadTemplates() {
      try {
        setIsLoading(true);
        const allTemplates = await templateService.getTemplates();
        setTemplates(allTemplates.slice(0, limit));
      } catch (error) {
        console.error("Error loading templates:", error);
        // Fallback to sample templates
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTemplates();
  }, [limit]);

  // Fallback templates if none exist in the database
  const fallbackTemplates = [
    {
      id: "t1",
      name: "Product Showcase",
      description: "Highlight your product features in a clean, professional format.",
      thumbnail: "/placeholder.svg",
      category: "Marketing",
      is_premium: false,
      created_at: new Date().toISOString(),
    },
    {
      id: "t2",
      name: "Social Media Story",
      description: "Engaging vertical format optimized for Instagram and TikTok.",
      thumbnail: "/placeholder.svg",
      category: "Social",
      is_premium: false,
      created_at: new Date().toISOString(),
    },
    {
      id: "t3",
      name: "Educational Explainer",
      description: "Clear step-by-step format to explain complex concepts.",
      thumbnail: "/placeholder.svg",
      category: "Education",
      is_premium: false,
      created_at: new Date().toISOString(),
    },
  ];

  const displayTemplates = templates.length > 0 ? templates : fallbackTemplates;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Popular Templates</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/templates">
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayTemplates.map((template) => (
            <TemplateCard key={template.id} {...template} />
          ))}
        </div>
      )}
    </div>
  );
}
