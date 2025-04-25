
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LayoutTemplate, ImagePlay, Film } from "lucide-react";

interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
}

const getPlaceholderImage = (category: string) => {
  // Use the second uploaded image for the template cards
  return "/lovable-uploads/8a1dbf1f-e165-4056-bd06-a594c9b170cd.png";
};

export function TemplateCard({ id, name, description, thumbnail, category }: TemplateCardProps) {
  const navigate = useNavigate();
  
  const handleUseTemplate = () => {
    navigate(`/dashboard/generator`, { state: { templateId: id } });
  };
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-border/40 hover:border-primary/20 bg-card" role="article" aria-labelledby={`template-${id}-title`}>
      <div className="relative">
        {thumbnail || getPlaceholderImage(category) ? (
          <img
            src={thumbnail || getPlaceholderImage(category)}
            alt={`Preview of ${name} template`}
            className="w-full aspect-video object-cover"
            loading="lazy"
            width="600"
            height="400"
          />
        ) : (
          <div className="w-full aspect-video bg-gradient-to-br from-secondary/10 to-primary/10 flex items-center justify-center" aria-label="Template placeholder image">
            <Film className="h-16 w-16 text-primary/40" aria-hidden="true" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <span className="text-xs font-medium text-white px-2 py-1 rounded-full bg-primary/90 backdrop-blur-sm">
            {category}
          </span>
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <ImagePlay className="h-12 w-12 text-white/80 bg-black/30 p-2 rounded-full" />
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2" id={`template-${id}-title`}>{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">{description}</p>
        <Button 
          onClick={handleUseTemplate} 
          className="w-full bg-primary hover:bg-primary-dark text-white"
          size="sm"
          aria-label={`Use ${name} template`}
        >
          Use This Template
        </Button>
      </CardContent>
    </Card>
  );
}
