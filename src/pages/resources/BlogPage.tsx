
import { useBlogPosts } from '@/hooks/useBlogPosts';
import { BlogPost } from '@/components/blog/BlogPost';
import SEOMetadata from '@/components/SEOMetadata';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search } from 'lucide-react';

export default function BlogPage() {
  const { posts, loading, error } = useBlogPosts();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter posts based on search term
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (post.description && post.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <SEOMetadata
        title="Blog"
        description="Read the latest articles about video creation, AI technology, and content marketing tips from the SmartVid team."
        keywords="AI video creation, content marketing, video tips, AI technology"
        ogType="website"
      />

      <div className="container px-4 md:px-6 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 text-center">
          Blog
        </h1>
        
        <div className="text-center mb-8">
          <p className="text-xl text-muted-foreground mb-8">
            {loading 
              ? "Loading blog posts..." 
              : "Read the latest articles from our team."}
          </p>

          {/* Search box */}
          <div className="max-w-md mx-auto relative">
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 px-2"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="text-center text-red-500 mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {!loading && filteredPosts.length === 0 && (
            <p className="text-xl text-muted-foreground text-center">
              {searchTerm 
                ? "No matching posts found. Try a different search term." 
                : "No blog posts available at the moment."}
            </p>
          )}

          {filteredPosts.map((post) => (
            <BlogPost 
              key={post.id} 
              {...post} 
              summary={post.description || ''} // Use description as summary
            />
          ))}
        </div>
      </div>
    </>
  );
}
