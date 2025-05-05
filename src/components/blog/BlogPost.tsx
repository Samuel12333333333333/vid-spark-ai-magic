
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { SocialShare } from "./SocialShare";

interface BlogPostProps {
  id: string;
  title: string;
  summary: string;
  content: string;
  created_at: string;
  slug?: string;
}

export function BlogPost({ id, title, summary, created_at, slug }: BlogPostProps) {
  // Use slug for URL if available, otherwise fall back to ID
  const urlPath = slug || id;
  const fullUrl = `${window.location.origin}/blog/${urlPath}`;
  
  return (
    <Card className="mb-6 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <SocialShare 
              title={title}
              url={fullUrl}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Posted {formatDistanceToNow(new Date(created_at))} ago
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-300">{summary}</p>
        <div className="flex items-center justify-between mt-4">
          <Link 
            to={`/blog/${urlPath}`}
            className="inline-block text-primary hover:underline"
          >
            Read more...
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
