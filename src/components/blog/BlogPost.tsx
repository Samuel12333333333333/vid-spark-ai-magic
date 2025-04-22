
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface BlogPostProps {
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

export function BlogPost({ title, summary, created_at }: BlogPostProps) {
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
        <button className="text-primary hover:underline mt-4">Read more...</button>
      </CardContent>
    </Card>
  );
}
