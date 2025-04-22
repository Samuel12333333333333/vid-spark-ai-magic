
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import MainLayout from '@/components/layout/MainLayout';

export default function BlogPostPage() {
  const { id } = useParams();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div>
        <MainLayout>
          <div className="container px-4 md:px-6 py-12 max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </MainLayout>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <MainLayout>
          <div className="container px-4 md:px-6 py-12 max-w-4xl mx-auto">
            <div className="text-center text-red-500">
              Error loading blog post. Please try again later.
            </div>
          </div>
        </MainLayout>
      </div>
    );
  }

  if (!post) {
    return (
      <div>
        <MainLayout>
          <div className="container px-4 md:px-6 py-12 max-w-4xl mx-auto">
            <div className="text-center">Blog post not found.</div>
          </div>
        </MainLayout>
      </div>
    );
  }

  return (
    <div>
      <Helmet>
        <title>{post.title} | SmartVid Blog</title>
        <meta name="description" content={post.summary} />
      </Helmet>

      <MainLayout>
        <article className="container px-4 md:px-6 py-12 max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
            <time className="text-sm text-muted-foreground">
              {format(new Date(post.created_at), 'MMMM d, yyyy')}
            </time>
          </header>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-8">{post.summary}</p>
            <div className="whitespace-pre-wrap">{post.content}</div>
          </div>
        </article>
      </MainLayout>
    </div>
  );
}
