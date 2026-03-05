DROP POLICY IF EXISTS "Blog posts are viewable by everyone" ON public.blog_posts;
CREATE POLICY "Blog posts are viewable by everyone"
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (true);