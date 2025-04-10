
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
    navigate(`/dashboard/generator`, { state: { templateId: id } });
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <img
          src={thumbnail || "/placeholder.svg"}
          alt={name}
          className="w-full aspect-video object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <span className="text-xs font-medium text-white px-2 py-1 bg-smartvid-600 rounded-full">
            {category}
          </span>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-1">{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
        <Button 
          onClick={handleUseTemplate} 
          className="w-full bg-smartvid-600 hover:bg-smartvid-700"
        >
          Use This Template
        </Button>
      </CardContent>
    </Card>
  );
}
