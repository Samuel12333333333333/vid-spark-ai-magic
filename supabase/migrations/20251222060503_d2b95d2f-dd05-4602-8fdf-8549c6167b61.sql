-- Create blog_posts table for storing blog content
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  description TEXT,
  thumbnail TEXT,
  category TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (blog posts are public)
CREATE POLICY "Blog posts are viewable by everyone" 
ON public.blog_posts 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert 3 high-quality blog posts with internal linking
INSERT INTO public.blog_posts (title, description, content, thumbnail, category) VALUES
(
  'How AI Video Generation is Revolutionizing Content Marketing in 2024',
  'Discover how AI-powered video tools like Smart Video are transforming the way brands create engaging content at scale.',
  '## The Rise of AI in Video Production

Video content has become the cornerstone of modern digital marketing. With platforms like TikTok, Instagram Reels, and YouTube Shorts dominating user attention, businesses need to produce more video content than ever before. But creating quality videos traditionally requires significant time, resources, and expertise.

Enter AI video generation – a game-changing technology that''s democratizing video production for businesses of all sizes.

### What Makes AI Video Generation Different?

Unlike traditional video editing software, [AI-powered tools](/features) use machine learning to automate the entire video creation process. From script generation to visual selection, these platforms can produce professional-quality videos in minutes rather than hours.

**Key benefits include:**
- **Speed**: Create videos 10x faster than manual production
- **Cost efficiency**: Reduce production costs by up to 80%
- **Consistency**: Maintain brand identity across all content
- **Scalability**: Produce hundreds of videos per month

### How Smart Video''s AI Works

Our [AI video generator](/dashboard/generator) uses a sophisticated three-step process:

1. **Script Analysis**: Our Gemini-powered AI breaks down your text prompt into distinct scenes
2. **Visual Matching**: Each scene is matched with relevant stock footage from our Pexels integration
3. **Professional Rendering**: Shotstack renders your video with smooth transitions and text overlays

This streamlined process means you can go from idea to finished video in under 5 minutes.

### Real-World Applications

Businesses across industries are leveraging AI video generation:

- **E-commerce**: Product showcase videos that drive conversions
- **Education**: Explainer videos that simplify complex topics
- **Marketing agencies**: Scale client deliverables without additional headcount
- **Startups**: Create pitch videos and promotional content on a budget

Explore our [templates library](/dashboard/templates) to see examples of what you can create.

### Getting Started

Ready to transform your content strategy? [Create your free account](/auth) and generate your first AI video today. With our intuitive interface and powerful [AI tools](/ai-tools), you''ll be creating professional videos in no time.

For pricing information on our Pro and Business plans, visit our [pricing page](/pricing).',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=60',
  'AI & Technology'
),
(
  '5 Types of Videos Every Small Business Should Create',
  'Learn the essential video formats that drive engagement, build trust, and convert viewers into customers for your small business.',
  '## Why Video Matters for Small Businesses

In today''s digital landscape, video content isn''t just nice to have – it''s essential. Studies show that 84% of consumers have been convinced to buy a product after watching a brand''s video. For small businesses, this presents an incredible opportunity to compete with larger competitors.

Here are the five video types every small business should prioritize:

### 1. Explainer Videos

**Purpose**: Clearly communicate what your business does and why it matters.

Explainer videos are perfect for your homepage or [product pages](/product). They should be:
- 60-90 seconds long
- Focused on solving a specific problem
- Include a clear call-to-action

**Pro tip**: Use our [AI script generator](/dashboard/scripts) to create compelling explainer video scripts in seconds.

### 2. Product Demonstration Videos

**Purpose**: Show your product or service in action.

Nothing builds trust like seeing a product work. These videos should:
- Highlight key features and benefits
- Show real-world applications
- Address common questions or objections

Our [template library](/dashboard/templates) includes ready-made product demo formats you can customize for your brand.

### 3. Customer Testimonial Videos

**Purpose**: Build social proof through authentic customer stories.

Testimonials are powerful because they let your satisfied customers sell for you. Tips for great testimonials:
- Keep them authentic and unscripted
- Focus on specific results achieved
- Include before/after scenarios when possible

### 4. Educational/How-To Content

**Purpose**: Establish expertise and provide value to your audience.

Educational content positions your brand as an authority. Consider:
- How-to guides related to your industry
- Tips and tricks your customers would value
- Industry insights and trends

Check out our [use cases page](/product/use-cases) for inspiration on educational content formats.

### 5. Social Media Short-Form Videos

**Purpose**: Drive engagement and reach new audiences.

Short-form video dominates social platforms. For maximum impact:
- Keep videos under 60 seconds
- Hook viewers in the first 3 seconds
- Optimize for mobile (vertical format)
- Include captions for silent viewing

### Create All Five with Smart Video

With [Smart Video''s AI generator](/dashboard/generator), you can create all five video types without any video editing experience. Our platform handles the technical work while you focus on your message.

Ready to level up your video marketing? [Start your free trial](/auth) today, or explore our [features](/features) to learn more about what''s possible.

Need help getting started? Visit our [Help Center](/help) for tutorials and best practices.',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&auto=format&fit=crop&q=60',
  'Marketing Tips'
),
(
  'The Complete Guide to Video Marketing ROI: Measuring What Matters',
  'Master the metrics that matter for video marketing success. Learn how to track, analyze, and optimize your video content for maximum return on investment.',
  '## Understanding Video Marketing ROI

Creating great videos is only half the battle. To truly succeed with video marketing, you need to measure performance and continuously optimize. This guide covers the essential metrics and strategies for maximizing your video marketing ROI.

### Why ROI Measurement Matters

Without proper tracking, you''re essentially flying blind. Understanding which videos perform best helps you:
- Allocate budget more effectively
- Double down on winning content types
- Identify and fix underperforming content
- Justify video marketing investment to stakeholders

### Key Metrics to Track

#### 1. View Count & Reach

**What it measures**: How many people saw your video

While view count is a vanity metric on its own, it''s important for understanding reach. Track:
- Total views across platforms
- Unique viewers
- Impressions vs. actual views

#### 2. Engagement Rate

**What it measures**: How actively viewers interact with your content

Engagement metrics include:
- **Watch time**: How long viewers stay engaged
- **Completion rate**: Percentage who watch to the end
- **Likes, comments, shares**: Social interactions
- **Click-through rate**: Actions taken after viewing

#### 3. Conversion Metrics

**What it measures**: Business outcomes driven by video

This is where ROI becomes tangible:
- **Lead generation**: Form fills attributed to video
- **Sales conversions**: Purchases influenced by video content
- **Sign-ups**: Account creations (like our [free trial](/auth))

#### 4. Cost Metrics

**What it measures**: Efficiency of your video production

Calculate your:
- **Cost per video**: Total production costs
- **Cost per view**: Production cost ÷ total views
- **Cost per conversion**: Production cost ÷ conversions generated

### Calculating True Video ROI

Use this formula:

**Video ROI = (Revenue Generated - Production Cost) ÷ Production Cost × 100**

For example, if a video costs $500 to produce and generates $2,000 in sales:
- ROI = ($2,000 - $500) ÷ $500 × 100 = **300% ROI**

### How Smart Video Improves Your ROI

Traditional video production is expensive and time-consuming. With [Smart Video](/features), you can:

1. **Reduce production costs by 80%**: Our AI handles the heavy lifting
2. **Create more content**: Produce 10x more videos in the same time
3. **Test and iterate quickly**: Try different approaches without breaking the budget
4. **Scale winning formats**: Once you find what works, replicate it easily

Explore our [pricing plans](/pricing) to see how much you could save compared to traditional production.

### Best Practices for Maximizing ROI

1. **Start with strategy**: Define goals before creating content
2. **Know your audience**: Use our [AI tools](/ai-tools) to generate targeted scripts
3. **Optimize for each platform**: Customize content for different channels
4. **A/B test everything**: Try different thumbnails, titles, and CTAs
5. **Repurpose content**: Turn one video into multiple pieces using our [templates](/dashboard/templates)

### Tools for Tracking

Most platforms have built-in analytics:
- YouTube Studio
- Meta Business Suite (Facebook/Instagram)
- TikTok Analytics
- LinkedIn Video Analytics

Complement these with Google Analytics for website video tracking.

### Getting Started

Ready to create high-ROI video content? Here''s your action plan:

1. [Create your Smart Video account](/auth)
2. Define your video marketing goals
3. Use our [AI generator](/dashboard/generator) to create your first video
4. Track performance using the metrics above
5. Optimize based on data

For more tips and strategies, check out our other [blog posts](/blog) or visit the [Help Center](/help).

Have questions about [integrations](/integrations) with your existing marketing stack? [Contact us](/contact) – we''re here to help!',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
  'Strategy & Analytics'
);