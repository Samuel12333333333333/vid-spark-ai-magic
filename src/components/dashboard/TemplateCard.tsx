
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Play, Film } from "lucide-react";

interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
}

export function TemplateCard({ id, name, description, thumbnail, category }: TemplateCardProps) {
  const navigate = useNavigate();
  
  const handleUseTemplate = () => {
    navigate(`/dashboard/templates/${id}`);
  };
  
  const getPlaceholderImage = (category: string) => {
    // Convert category to lowercase for case-insensitive matching
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory === 'marketing') {
      return "/lovable-uploads/placeholder-marketing.png";
    } else if (lowerCategory === 'social') {
      return "/lovable-uploads/placeholder-social.png";  
    } else if (lowerCategory === 'education') {
      return "/lovable-uploads/placeholder-education.png";
    } else if (lowerCategory === 'business') {
      return "/lovable-uploads/placeholder-business.png";
    }
    
    // Default fallback
    return "/placeholder.svg";
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-border/40 hover:border-primary/20 bg-card" role="article" aria-labelledby={`template-${id}-title`}>
      <div className="relative">
        <img
          src={thumbnail || getPlaceholderImage(category)}
          alt={`Preview of ${name} template`}
          className="w-full aspect-video object-cover"
          loading="lazy"
          width="600"
          height="400"
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.src = getPlaceholderImage(category);
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <span className="text-xs font-medium text-white px-2 py-1 rounded-full bg-primary/90 backdrop-blur-sm">
            {category}
          </span>
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="h-12 w-12 text-white/80 bg-black/30 p-2 rounded-full" />
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
