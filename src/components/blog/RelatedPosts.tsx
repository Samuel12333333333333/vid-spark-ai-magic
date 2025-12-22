import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";
import { BlogPost } from "@/types/supabase";

interface RelatedPostsProps {
  posts: BlogPost[];
  currentPostId: string;
}

export function RelatedPosts({ posts, currentPostId }: RelatedPostsProps) {
  // Filter out current post and get up to 3 related posts
  const relatedPosts = posts
    .filter((p) => p.id !== currentPostId)
    .slice(0, 3);

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPosts.map((post) => {
          const postUrl = post.slug ? `/blog/${post.slug}` : `/blog/${post.id}`;
          const formattedDate = post.created_at
            ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
            : "Recently";

          return (
            <Card key={post.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <Link to={postUrl}>
                {post.thumbnail && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  {post.category && (
                    <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                      {post.category}
                    </span>
                  )}
                  <h3 className="font-semibold mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-muted-foreground">{formattedDate}</span>
                    <span className="text-sm text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Read <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
