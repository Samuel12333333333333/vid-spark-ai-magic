
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Template } from "@/types/template";

interface TemplateCardProps extends Template {
  onSelect?: (id: string) => void;
  compact?: boolean;
}

export function TemplateCard({
  id,
  name,
  description,
  category,
  thumbnail,
  is_premium,
  created_at,
  onSelect,
  compact = false
}: TemplateCardProps) {
  const handleSelect = () => {
    if (onSelect) {
      onSelect(id);
    }
  };
  
  const getPlaceholderImage = () => {
    const lowerCaseCategory = category ? category.toLowerCase() : '';
    
    // Match category to specific placeholder images
    if (lowerCaseCategory === 'marketing') {
      return "/lovable-uploads/placeholder-marketing.png";
    } else if (lowerCaseCategory === 'social') {
      return "/lovable-uploads/placeholder-social.png";
    } else if (lowerCaseCategory === 'education') {
      return "/lovable-uploads/placeholder-education.png";
    } else if (lowerCaseCategory === 'business') {
      return "/lovable-uploads/placeholder-business.png";
    }
    
    // Fallback to default placeholder
    return "/placeholder.svg";
  };

  return (
    <Card className={`overflow-hidden ${compact ? "h-full" : ""} flex flex-col transition-shadow hover:shadow-md`}>
      <div className="relative overflow-hidden" style={{ height: compact ? "120px" : "160px" }}>
        <img
          src={thumbnail || getPlaceholderImage()}
          alt={name}
          className="h-full w-full object-cover transition-transform hover:scale-105"
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.src = getPlaceholderImage();
          }}
        />
        {is_premium && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
              <Star className="mr-1 h-3 w-3" />
              Premium
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className={`${compact ? "p-3" : "p-4"}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className={`font-medium leading-tight ${compact ? "text-sm" : "text-base"}`}>{name}</h3>
            {!compact && <Badge variant="outline" className="mt-1">{category}</Badge>}
          </div>
        </div>
      </CardHeader>
      
      {!compact && (
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </CardContent>
      )}
      
      <CardFooter className={`${compact ? "p-3" : "p-4"} border-t bg-muted/20`}>
        {onSelect ? (
          <Button className="w-full" size={compact ? "sm" : "default"} onClick={handleSelect}>
            <Play className={`mr-2 ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
            Use Template
          </Button>
        ) : (
          <Button className="w-full" size={compact ? "sm" : "default"} asChild>
            <Link to={`/dashboard/templates/${id}`}>
              <Play className={`mr-2 ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
              Use Template
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
