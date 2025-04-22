
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type BlogPost = Database['public']['Tables']['blog_posts']['Row'];

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
        setPosts(data || []);
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
            setPosts(currentPosts => [payload.new as BlogPost, ...currentPosts]);
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
