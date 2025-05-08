
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";
import { BlogPost as BlogPostType } from "@/types/supabase";

export interface BlogPostProps extends BlogPostType {
  summary?: string; // Make summary optional to fix the type issues
}

export function BlogPost({ id, title, summary, thumbnail, category, created_at, slug, description }: BlogPostProps) {
  // Format the created_at date if it exists
  const formattedDate = created_at 
    ? formatDistanceToNow(new Date(created_at), { addSuffix: true }) 
    : "Recently";
    
  // Use slug if available, otherwise use ID
  const postUrl = slug ? `/blog/${slug}` : `/blog/${id}`;
  
  // Use summary if available, otherwise use description or empty string
  const displaySummary = summary || description || "";

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {thumbnail && (
          <Link to={postUrl} className="md:w-1/3">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-48 md:h-full object-cover"
            />
          </Link>
        )}
        <div className={`flex-1 ${!thumbnail ? 'md:w-full' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              {category && (
                <span className="text-xs font-medium px-2.5 py-1 rounded bg-muted">
                  {category}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            </div>
            <CardTitle className="mt-2">
              <Link to={postUrl} className="hover:underline">
                {title}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground line-clamp-2 mb-4">{displaySummary}</p>
            <Button variant="outline" asChild>
              <Link to={postUrl}>
                Read More <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
