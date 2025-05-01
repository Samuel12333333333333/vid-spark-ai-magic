
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-background sticky top-0 z-40 w-full border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-smartvid-600">SmartVid</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              to="#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
            <Link
              to="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              to="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              to="#testimonials"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:flex gap-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button className="bg-smartvid-600 hover:bg-smartvid-700" asChild>
                <Link to="/register">Sign Up</Link>
              </Button>
            </div>
            <Button
              className="md:hidden"
              variant="ghost"
              size="icon"
              aria-label="Toggle Menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        
        {/* Testimonials Section */}
        <section id="testimonials" className="py-12 md:py-24 bg-white dark:bg-gray-950">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Loved by Creators Everywhere
                </h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  See what our users are saying about SmartVid
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              {/* Testimonial 1 */}
              <div className="rounded-lg border p-6 shadow-md dark:border-gray-800">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-4">
                    JP
                  </div>
                  <div>
                    <h3 className="font-bold">James Peterson</h3>
                    <p className="text-sm text-muted-foreground">Marketing Director</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  "SmartVid has completely transformed our content creation process. 
                  We create 5x more videos in half the time it used to take us."
                </p>
              </div>
              
              {/* Testimonial 2 */}
              <div className="rounded-lg border p-6 shadow-md dark:border-gray-800">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-4">
                    SL
                  </div>
                  <div>
                    <h3 className="font-bold">Sarah Lee</h3>
                    <p className="text-sm text-muted-foreground">Content Creator</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  "As a solo creator, SmartVid has been a game-changer for my workflow. 
                  I can now create professional videos without any technical skills."
                </p>
              </div>
              
              {/* Testimonial 3 */}
              <div className="rounded-lg border p-6 shadow-md dark:border-gray-800">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-4">
                    MR
                  </div>
                  <div>
                    <h3 className="font-bold">Michael Rodriguez</h3>
                    <p className="text-sm text-muted-foreground">Education Specialist</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  "We use SmartVid to create educational content for our students. 
                  The quality and speed have exceeded our expectations."
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <PricingSection />
        
        {/* FAQ Section */}
        <section id="faq" className="py-12 md:py-24 bg-white dark:bg-gray-950">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Frequently Asked Questions
                </h2>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Find answers to common questions about SmartVid
                </p>
              </div>
            </div>
            
            <div className="mx-auto max-w-3xl space-y-6 mt-12">
              {/* FAQ Item 1 */}
              <div className="rounded-lg border p-6 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-2">How does SmartVid work?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  SmartVid uses AI to analyze your text prompt, break it into scenes, find relevant 
                  stock video clips, and assemble them into a cohesive video with transitions and text overlays.
                </p>
              </div>
              
              {/* FAQ Item 2 */}
              <div className="rounded-lg border p-6 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-2">How long does it take to generate a video?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Most videos are generated within 1-3 minutes, depending on the complexity and length 
                  of your request. Longer videos or those with special effects may take a bit longer.
                </p>
              </div>
              
              {/* FAQ Item 3 */}
              <div className="rounded-lg border p-6 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-2">Can I use my own videos and images?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! You can upload your own videos and images to include in your project, 
                  or combine them with our stock library for more options.
                </p>
              </div>
              
              {/* FAQ Item 4 */}
              <div className="rounded-lg border p-6 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-2">What video formats and quality are supported?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  SmartVid generates videos in MP4 format. Free users get 720p resolution, while 
                  Pro users get 1080p and Business users get up to 4K resolution.
                </p>
              </div>
              
              {/* FAQ Item 5 */}
              <div className="rounded-lg border p-6 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-2">Do I own the videos I create?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, you own all rights to the videos you create with SmartVid. The stock footage 
                  we provide is licensed for your commercial use.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-12 md:py-24 bg-smartvid-600 text-white">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Transform Your Content?
              </h2>
              <p className="max-w-[600px] md:text-xl/relaxed">
                Join thousands of creators and marketers who are saving time and creating 
                stunning videos with SmartVid.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-smartvid-600 hover:bg-gray-100">
                  <Link to="/register">Get Started Free</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Link to="/contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
