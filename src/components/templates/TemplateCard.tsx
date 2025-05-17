
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Play, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Template } from "@/types/template";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useState } from "react";
import { toast } from "sonner";

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
  is_pro_only,
  is_business_only,
  created_at,
  onSelect,
  compact = false
}: TemplateCardProps) {
  const { hasActiveSubscription, isPro, isBusiness } = useSubscription();
  const [isHovering, setIsHovering] = useState(false);
  
  const handleSelect = () => {
    // Check if the user has the required subscription to use this template
    if (is_business_only && !isBusiness) {
      toast.error("Business subscription required", {
        description: "This template requires a Business subscription"
      });
      return;
    }
    
    if ((is_premium || is_pro_only) && !hasActiveSubscription) {
      toast.error("Subscription required", {
        description: "This template requires a subscription"
      });
      return;
    }
    
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
  
  // Determine if template is locked based on subscription
  const isLocked = (is_business_only && !isBusiness) || 
                  ((is_premium || is_pro_only) && !hasActiveSubscription);

  return (
    <Card 
      className={`overflow-hidden ${compact ? "h-full" : ""} flex flex-col transition-shadow hover:shadow-md`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative overflow-hidden" style={{ height: compact ? "120px" : "160px" }}>
        <img
          src={thumbnail || getPlaceholderImage()}
          alt={name}
          className={`h-full w-full object-cover transition-transform ${isHovering ? 'scale-105' : ''}`}
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.src = getPlaceholderImage();
          }}
        />
        {/* Premium badge */}
        {is_premium && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
              <Star className="mr-1 h-3 w-3" />
              Premium
            </Badge>
          </div>
        )}
        
        {/* Subscription tier badges */}
        {is_pro_only && !is_business_only && (
          <div className="absolute top-2 left-2">
            <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">
              Pro
            </Badge>
          </div>
        )}
        
        {is_business_only && (
          <div className="absolute top-2 left-2">
            <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
              Business
            </Badge>
          </div>
        )}
        
        {/* Locked overlay for subscription-only templates */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center text-white">
              <Lock className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm font-medium">
                {is_business_only ? "Business Plan" : "Subscription"} Required
              </p>
            </div>
          </div>
        )}
      </div>
      
      <CardHeader className={`${compact ? "p-3" : "p-4"}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className={`font-medium leading-tight ${compact ? "text-sm" : "text-base"}`}>{name}</h3>
            {!compact && category && <Badge variant="outline" className="mt-1">{category}</Badge>}
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
          <Button 
            className="w-full" 
            size={compact ? "sm" : "default"} 
            onClick={handleSelect}
            disabled={isLocked}
          >
            <Play className={`mr-2 ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
            {isLocked ? "Upgrade to Use" : "Use Template"}
          </Button>
        ) : (
          <Button className="w-full" size={compact ? "sm" : "default"} asChild disabled={isLocked}>
            <Link to={isLocked ? "#" : `/dashboard/templates/${id}`}>
              <Play className={`mr-2 ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
              {isLocked ? "Upgrade to Use" : "Use Template"}
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
