import { Helmet } from 'react-helmet-async';
import { BlogPost } from '@/components/blog/BlogPost';
import { useBlogPosts } from '@/hooks/useBlogPosts';

export default function BlogPage() {
  const { posts, loading, error } = useBlogPosts();

  return (
    <>
      <Helmet>
        {/* General Meta Tags for Blog Page */}
        <title>Blog | SmartVid AI Video Generator</title>
        <meta 
          name="description" 
          content="Read the latest articles about video creation, AI technology, and content marketing tips from the SmartVid team." 
        />
        <meta property="og:title" content="Blog | SmartVid AI Video Generator" />
        <meta 
          property="og:description" 
          content="Read the latest articles about video creation, AI technology, and content marketing tips from the SmartVid team." 
        />
        <meta property="og:image" content="URL_TO_YOUR_DEFAULT_IMAGE" /> {/* Optional default image */}
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:title" content="Blog | SmartVid AI Video Generator" />
        <meta 
          name="twitter:description" 
          content="Read the latest articles about video creation, AI technology, and content marketing tips from the SmartVid team." 
        />
        <meta name="twitter:image" content="URL_TO_YOUR_DEFAULT_IMAGE" /> {/* Optional default image */}
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
            <div key={post.id}>
              <Helmet>
                {/* Meta Tags for Individual Blog Post */}
                <title>{post.title} | SmartVid AI Video Generator</title>
                <meta 
                  name="description" 
                  content={post.excerpt || 'Read the full post on SmartVid AI Video Generator.'} 
                />
                <meta property="og:title" content={post.title} />
                <meta 
                  property="og:description" 
                  content={post.excerpt || 'Read the full post.'} 
                />
                <meta property="og:image" content={post.image} />
                <meta property="og:url" content={window.location.href} />
                <meta name="twitter:title" content={post.title} />
                <meta 
                  name="twitter:description" 
                  content={post.excerpt || 'Read the full post.'} 
                />
                <meta name="twitter:image" content={post.image} />
              </Helmet>
              <BlogPost {...post} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

