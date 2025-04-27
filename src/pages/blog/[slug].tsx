import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import SEOMetadata from "@/components/SEOMetadata";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { slugify } from "@/utils/slugify";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { posts, loading } = useBlogPosts();
  const [post, setPost] = useState<any>(null);
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && posts.length > 0 && slug) {
      let foundPost = posts.find(p => p.slug === slug);
      
      if (!foundPost) {
        foundPost = posts.find(p => p.id === slug);
      }
      
      if (foundPost) {
        setPost(foundPost);
      }
    }
  }, [slug, posts, loading]);

  useEffect(() => {
    const fetchDirectFromDB = async () => {
      if (!loading && !post && slug) {
        setLoadingDirect(true);
        try {
          let { data, error: fetchError } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('id', slug)
            .single();
          
          if (!data) {
            const { data: allPosts, error: allPostsError } = await supabase
              .from('blog_posts')
              .select('*');
              
            if (allPostsError) throw allPostsError;
            
            data = (allPosts || []).find(p => slugify(p.title) === slug) || null;
          }
          
          if (data) {
            setPost({
              ...data,
              slug: slugify(data.title)
            });
          } else {
            setError("Blog post not found");
            toast.error("Blog post not found");
            setTimeout(() => navigate("/blog"), 2000);
          }
        } catch (err) {
          console.error("Error fetching post directly:", err);
          setError("Failed to load blog post");
        } finally {
          setLoadingDirect(false);
        }
      }
    };
    
    fetchDirectFromDB();
  }, [slug, post, loading, navigate]);

  if (loading || loadingDirect) {
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
