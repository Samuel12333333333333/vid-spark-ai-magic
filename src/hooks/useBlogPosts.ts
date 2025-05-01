
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { slugify } from '@/utils/slugify';

// Define the base BlogPost type from the database
type BaseBlogPost = Database['public']['Tables']['blog_posts']['Row'];

// Extend the type to include the slug property
export type BlogPost = BaseBlogPost & {
  slug?: string;
};

export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;

    async function fetchPosts() {
      try {
        const { data, error: fetchError } = await supabase
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        
        // Process the posts to add slugs if they don't exist in the database
        const processedPosts = (data || []).map(post => ({
          ...post,
          // Generate slug from title if not present in the database
          slug: slugify(post.title)
        }));
        
        setPosts(processedPosts);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    }

    // Set up realtime subscription
    function setupRealtimeSubscription() {
      channel = supabase
        .channel('blog_posts_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'blog_posts'
          },
          (payload) => {
            const newPost = payload.new as BaseBlogPost;
            // Add slug to new posts
            const postWithSlug: BlogPost = {
              ...newPost,
              slug: slugify(newPost.title)
            };
            setPosts(currentPosts => [postWithSlug, ...currentPosts]);
          }
        )
        .subscribe();
    }

    fetchPosts();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { posts, loading, error };
}
