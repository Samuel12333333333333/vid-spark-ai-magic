
import { Button } from "@/components/ui/button";
import { TemplateCard } from "@/components/dashboard/TemplateCard";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface PopularTemplatesProps {
  templates: any[];
}

export function PopularTemplates({ templates = [] }: PopularTemplatesProps) {
  // Fallback templates if none exist in the database
  const fallbackTemplates = [
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayTemplates.map((template) => (
          <TemplateCard key={template.id} {...template} />
        ))}
      </div>
    </div>
  );
}
