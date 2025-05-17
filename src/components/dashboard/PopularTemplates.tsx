
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

// Default templates to show when none are found in the database
const defaultTemplates: Template[] = [
  {
    id: "default-1",
    name: "Product Showcase",
    description: "Highlight your product features with animations and text overlays",
    thumbnail: "/lovable-uploads/placeholder-marketing.png",
    category: "Marketing",
    is_premium: false,
    is_pro_only: false,
    is_business_only: false,
    created_at: new Date().toISOString()
  },
  {
    id: "default-2",
    name: "Social Media Story",
    description: "Vertical format optimized for Instagram and TikTok with text animations",
    thumbnail: "/lovable-uploads/placeholder-social.png",
    category: "Social",
    is_premium: false,
    is_pro_only: false,
    is_business_only: false,
    created_at: new Date().toISOString()
  },
  {
    id: "default-3",
    name: "Educational Explainer",
    description: "Step-by-step format to explain concepts clearly with animated transitions",
    thumbnail: "/lovable-uploads/placeholder-education.png",
    category: "Education",
    is_premium: false,
    is_pro_only: false,
    is_business_only: false,
    created_at: new Date().toISOString()
  }
];

export function PopularTemplates({ limit = 3 }: PopularTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadTemplates() {
      try {
        setIsLoading(true);
        const allTemplates = await templateService.getTemplates();
        // Use the templates from the database if available, otherwise use defaults
        setTemplates(allTemplates.length > 0 ? allTemplates.slice(0, limit) : defaultTemplates.slice(0, limit));
      } catch (error) {
        console.error("Error loading templates:", error);
        setTemplates(defaultTemplates.slice(0, limit));
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTemplates();
  }, [limit]);

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
          {templates.map((template) => (
            <TemplateCard 
              key={template.id} 
              {...template} 
              compact={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
