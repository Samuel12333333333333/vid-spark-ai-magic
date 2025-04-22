
import { Helmet } from 'react-helmet-async';
import { BlogPost } from '@/components/blog/BlogPost';
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { MainLayout } from '@/components/layout/MainLayout';

export default function BlogPage() {
  const { posts, loading, error } = useBlogPosts();

  return (
    <MainLayout>
      <Helmet>
        <title>Blog | SmartVid AI Video Generator</title>
        <meta 
          name="description" 
          content="Read the latest articles about video creation, AI technology, and content marketing tips from the SmartVid team." 
        />
      </Helmet>

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center">
          Blog
        </h1>
        
        <div className="text-center mb-12">
          <p className="text-xl text-muted-foreground">
            {loading 
              ? "Loading blog posts..." 
              : "Read the latest articles from our team."}
          </p>
        </div>

        {error && (
          <div className="text-center text-red-500 mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {!loading && posts.length === 0 && (
            <p className="text-xl text-muted-foreground text-center">
              No blog posts available at the moment.
            </p>
          )}

          {posts.map((post) => (
            <BlogPost key={post.id} {...post} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
