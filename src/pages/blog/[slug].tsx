
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import SEOMetadata from "@/components/SEOMetadata";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { posts, loading, error } = useBlogPosts();
  const [post, setPost] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && posts.length > 0 && slug) {
      // First try to find by slug
      let foundPost = posts.find(p => p.slug === slug);
      
      // If not found by slug, try to find by ID (for backward compatibility)
      if (!foundPost) {
        foundPost = posts.find(p => p.id === slug);
      }
      
      if (foundPost) {
        setPost(foundPost);
      }
    }
  }, [slug, posts, loading]);

  if (loading) {
    return (
      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <div className="text-center text-red-500">
          <p className="text-xl">{error}</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Post not found.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOMetadata
        title={post.title}
        description={post.summary}
        keywords={`${post.title}, AI video creation, SmartVid`}
        canonicalUrl={`/blog/${post.slug || post.id}`}
        ogType="article"
      />
      
      <div className="container px-4 md:px-6 py-12 max-w-4xl mx-auto">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{post.title}</h1>
          <p className="text-sm text-muted-foreground">
            Posted {formatDistanceToNow(new Date(post.created_at))} ago
          </p>
        </div>
        
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
