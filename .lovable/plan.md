

# Fix Blog Posts Not Loading

## Problem
Two issues prevent the blog posts from displaying:

1. **Wrong Supabase project**: `src/integrations/supabase/client.ts` is hardcoded to connect to `rtzitylynowjenfoztum.supabase.co`, but the Lovable-connected Supabase project (where the blog posts were inserted) is `edwpmysfxxijxhworisc.supabase.co`.

2. **RLS policy issue**: The existing RLS policy on `blog_posts` is marked as **RESTRICTIVE** (`Permissive: No`). Restrictive policies narrow access — they don't grant it on their own. There must be at least one permissive SELECT policy for rows to be readable.

## Plan

### Step 1: Fix Supabase client configuration
Update `src/integrations/supabase/client.ts` to use the correct Supabase project:
- URL: `https://edwpmysfxxijxhworisc.supabase.co`
- Anon key: the one for `edwpmysfxxijxhworisc`

### Step 2: Fix RLS policy on blog_posts
Run a migration to:
1. Drop the existing restrictive policy
2. Create a new **permissive** SELECT policy allowing public read access

```sql
DROP POLICY IF EXISTS "Blog posts are viewable by everyone" ON public.blog_posts;
CREATE POLICY "Blog posts are viewable by everyone"
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (true);
```

### Step 3: Verify
Navigate to `/blog` and confirm all 3 posts load and display correctly.

