
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { BlogPost } from "@/types/supabase";

export default function BlogPostPage() {
  const { id } = useParams();
  const { posts, loading, error } = useBlogPosts();
  const [post, setPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (!loading && posts.length > 0) {
      const foundPost = posts.find(p => p.id === id);
      if (foundPost) {
        setPost(foundPost);
      }
    }
  }, [id, posts, loading]);

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
      <Helmet>
        <title>{post.title} | SmartVid Blog</title>
        <meta 
          name="description" 
          content={post.description || ''} 
        />
      </Helmet>
      
      <div className="container px-4 md:px-6 py-12 max-w-4xl mx-auto">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{post.title}</h1>
          <p className="text-sm text-muted-foreground">
            Posted {formatDistanceToNow(new Date(post.created_at || ''), { addSuffix: true })}
          </p>
        </div>
        
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
