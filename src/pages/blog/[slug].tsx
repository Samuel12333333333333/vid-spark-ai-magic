
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import SEOMetadata from "@/components/SEOMetadata";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { slugify } from "@/utils/slugify";
import { BlogProgress } from "@/components/blog/BlogProgress";
import { SocialShare } from "@/components/blog/SocialShare";
import { TextToSpeech } from "@/components/blog/TextToSpeech";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, ArrowLeft } from "lucide-react";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { posts, loading } = useBlogPosts();
  const [post, setPost] = useState<any>(null);
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpful, setHelpful] = useState<boolean | null>(null);
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

  const handleHelpfulFeedback = (isHelpful: boolean) => {
    setHelpful(isHelpful);
    
    // In a real implementation, you might want to save this feedback to your database
    toast.success(`Thank you for your feedback!`);
    
    // Analytics event could be tracked here
    console.log(`User rated article as ${isHelpful ? 'helpful' : 'not helpful'}`);
  };

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

  const articleUrl = `${window.location.origin}/blog/${post.slug || post.id}`;

  return (
    <>
      <SEOMetadata
        title={post.title}
        description={post.summary}
        keywords={`${post.title}, AI video creation, Smart Video`}
        canonicalUrl={`/blog/${post.slug || post.id}`}
        ogType="article"
      />
      
      <BlogProgress />
      
      <div className="container px-4 md:px-6 py-12 max-w-5xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => navigate("/blog")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to all posts
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Table of Contents - Desktop */}
          <div className="hidden md:block md:col-span-3">
            <TableOfContents />
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-9">
            <div className="space-y-2 mb-8">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{post.title}</h1>
              
              <div className="flex flex-wrap justify-between items-center gap-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Posted {formatDistanceToNow(new Date(post.created_at))} ago
                </p>
                
                <div className="flex items-center space-x-2">
                  <TextToSpeech text={post.content} title={post.title} />
                  <SocialShare title={post.title} url={articleUrl} />
                </div>
              </div>
            </div>
            
            <Card className="mb-8 overflow-hidden">
              <CardContent className="pt-6">
                <div className="prose dark:prose-invert max-w-none blog-content">
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>
              </CardContent>
            </Card>
            
            {/* Feedback section */}
            <div className="border rounded-lg p-6 mt-8">
              <h3 className="text-lg font-medium mb-4">Was this article helpful?</h3>
              
              <div className="flex items-center space-x-4">
                <Button
                  variant={helpful === true ? "default" : "outline"}
                  onClick={() => handleHelpfulFeedback(true)}
                  disabled={helpful !== null}
                  className="flex items-center space-x-2"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Yes, it helped
                </Button>
                
                <Button
                  variant={helpful === false ? "default" : "outline"}
                  onClick={() => handleHelpfulFeedback(false)}
                  disabled={helpful !== null}
                  className="flex items-center space-x-2"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Not really
                </Button>
              </div>
              
              {helpful !== null && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Thanks for your feedback! We'll use it to improve our content.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
