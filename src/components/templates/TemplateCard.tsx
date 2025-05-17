
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
    if (category) {
      return `/lovable-uploads/placeholder-${category.toLowerCase()}.png`;
    }
    return "/placeholder.svg";
  };

  return (
    <Card className={`overflow-hidden ${compact ? "h-full" : ""} flex flex-col transition-shadow hover:shadow-md`}>
      <div className="relative overflow-hidden" style={{ height: compact ? "120px" : "160px" }}>
        {(thumbnail || getPlaceholderImage()) ? (
          <img
            src={thumbnail || getPlaceholderImage()}
            alt={name}
            className="h-full w-full object-cover transition-transform hover:scale-105"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
          </div>
        )}
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
