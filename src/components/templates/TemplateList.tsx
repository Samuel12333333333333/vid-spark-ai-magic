
import { TemplateCard } from "@/components/templates/TemplateCard";
import { Template } from "@/types/template";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, SearchX } from "lucide-react";

interface TemplateListProps {
  templates: Template[];
  viewMode: "grid" | "list";
  isLoading?: boolean;
  onSelectTemplate?: (id: string) => void;
}

export function TemplateList({
  templates,
  viewMode,
  isLoading = false,
  onSelectTemplate
}: TemplateListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium">No templates found</h3>
        <p className="text-muted-foreground mt-1 max-w-md">
          No templates match your current search criteria. Try adjusting your filters or search term.
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center p-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
              onClick={() => onSelectTemplate && onSelectTemplate(template.id)}
            >
              <div className="w-16 h-16 rounded overflow-hidden mr-4 flex-shrink-0">
                <img
                  src={template.thumbnail || "/placeholder.svg"}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow">
                <h3 className="font-medium">{template.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {template.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <TemplateCard 
          key={template.id} 
          {...template} 
          onSelect={onSelectTemplate}
        />
      ))}
    </div>
  );
}
