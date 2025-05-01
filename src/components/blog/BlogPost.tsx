
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

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
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">
            Posted {formatDistanceToNow(new Date(created_at))} ago
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-300">{summary}</p>
        <Link 
          to={`/blog/${urlPath}`}
          className="inline-block text-primary hover:underline mt-4"
        >
          Read more...
        </Link>
      </CardContent>
    </Card>
  );
}
