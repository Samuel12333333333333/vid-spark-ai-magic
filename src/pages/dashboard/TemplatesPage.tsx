
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Plus } from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";
import { Link } from "react-router-dom";

export default function TemplatesPage() {
  const { templates, loading, error } = useTemplates();

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Video Templates</h1>
          <p className="text-muted-foreground">
            Choose from our collection of professional video templates
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Video Templates</h1>
          <p className="text-muted-foreground">
            Choose from our collection of professional video templates
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              Failed to load templates. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Video Templates</h1>
          <p className="text-muted-foreground">
            Choose from our collection of professional video templates
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/generator">
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Video
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="aspect-video bg-gray-100 rounded-md mb-4 flex items-center justify-center relative overflow-hidden">
                {template.thumbnail_url ? (
                  <img
                    src={template.thumbnail_url}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Play className="h-8 w-8 text-gray-400" />
                )}
                {template.is_premium && (
                  <Badge className="absolute top-2 right-2 bg-yellow-500">
                    Premium
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Badge variant="outline">{template.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {template.description}
              </p>
              <div className="flex items-center justify-between mb-4">
                {template.duration && (
                  <span className="text-xs text-muted-foreground">
                    Duration: {template.duration}s
                  </span>
                )}
                {template.style && (
                  <Badge variant="secondary" className="text-xs">
                    {template.style}
                  </Badge>
                )}
              </div>
              <Button className="w-full" asChild>
                <Link to={`/dashboard/templates/${template.id}`}>
                  Use Template
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
