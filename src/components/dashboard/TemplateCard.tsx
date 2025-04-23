
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LayoutTemplate } from "lucide-react";

interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
}

const getPlaceholderImage = (category: string) => {
  const images = {
    marketing: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
    social: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
    education: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    business: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7",
    default: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  };
  
  return `${images[category as keyof typeof images] || images.default}?w=600&h=400&fit=crop&auto=format`;
};

export function TemplateCard({ id, name, description, thumbnail, category }: TemplateCardProps) {
  const navigate = useNavigate();
  
  const handleUseTemplate = () => {
    navigate(`/dashboard/generator`, { state: { templateId: id } });
  };
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-border/40 hover:border-primary/20 bg-card">
      <div className="relative">
        {thumbnail || getPlaceholderImage(category) ? (
          <img
            src={thumbnail || getPlaceholderImage(category)}
            alt={name}
            className="w-full aspect-video object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-video bg-gradient-to-br from-secondary/10 to-primary/10 flex items-center justify-center">
            <LayoutTemplate className="h-16 w-16 text-primary/40" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <span className="text-xs font-medium text-white px-2 py-1 rounded-full bg-primary/90 backdrop-blur-sm">
            {category}
          </span>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">{description}</p>
        <Button 
          onClick={handleUseTemplate} 
          className="w-full bg-primary hover:bg-primary-dark text-white"
          size="sm"
        >
          Use This Template
        </Button>
      </CardContent>
    </Card>
  );
}
