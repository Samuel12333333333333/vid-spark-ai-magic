
import { TemplateCard } from "@/components/dashboard/TemplateCard";
import type { Template } from "@/types/template";
import { Button } from "@/components/ui/button";

interface TemplateListProps {
  templates: Template[];
  viewMode: "grid" | "list";
}

export function TemplateList({ templates, viewMode }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No templates found matching your search</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${
      viewMode === "grid" 
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
        : "grid-cols-1"
    }`}>
      {templates.map((template) => (
        <TemplateCard key={template.id} {...template} />
      ))}
    </div>
  );
}
