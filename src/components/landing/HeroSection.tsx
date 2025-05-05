
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";

export function HeroSection() {
  // Function to handle demo button click - scrolls to demo section or navigates to product page
  const handleWatchDemoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Try to find demo section on current page
    const demoSection = document.getElementById('demo-section');
    
    if (demoSection) {
      // If we're on the page with demo section, scroll to it
      demoSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If we're not on a page with the demo, navigate to product page with demo section
      window.location.href = '/product#demo-section';
    }
  };

  return (
    <section className="py-20 md:py-28 lg:py-32 relative overflow-hidden bg-gradient-to-b from-background to-background/80">
      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container px-4 md:px-6 relative">
        <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm bg-card animate-fade-in hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span>AI-Powered Video Creation</span>
          </div>

          {/* Animated Title with Gradient */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in [animation-delay:200ms] bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-secondary hover:scale-[1.02] transition-transform">
            Turn Text Into Videos
            <br />
            <span className="text-foreground">in Minutes</span>
          </h1>

          {/* Animated Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-[42rem] leading-relaxed animate-fade-in [animation-delay:400ms]">
            SmartVid uses AI to instantly turn your ideas into professional, engaging videos. 
            No technical skills required — just type and watch the magic happen.
          </p>

          {/* Animated CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center animate-fade-in [animation-delay:600ms]">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white h-12 px-8 hover:scale-105 transition-all duration-300" 
              asChild
            >
              <Link to="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 animate-bounce-slow" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-12 px-8 hover:scale-105 transition-all duration-300 group" 
              onClick={handleWatchDemoClick}
            >
              <Play className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              Watch Demo
            </Button>
          </div>

          {/* Animated Trust Signals */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground pt-4 animate-fade-in [animation-delay:800ms]">
            <div className="flex items-center hover:text-primary transition-colors">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary mr-2 animate-bounce-slow">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center hover:text-primary transition-colors">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary mr-2 animate-bounce-slow [animation-delay:200ms]">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              <span>Free plan available</span>
            </div>
            <div className="flex items-center hover:text-primary transition-colors">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary mr-2 animate-bounce-slow [animation-delay:400ms]">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Client Logos Section */}
        <div className="mt-16 md:mt-20">
          <p className="text-center text-sm text-muted-foreground mb-6">TRUSTED BY INNOVATIVE COMPANIES</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <div className="h-8 md:h-10 w-24 md:w-32 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center text-xs font-semibold">ACME INC</div>
            </div>
            <div className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <div className="h-8 md:h-10 w-24 md:w-32 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center text-xs font-semibold">GLOBALTECH</div>
            </div>
            <div className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <div className="h-8 md:h-10 w-24 md:w-32 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center text-xs font-semibold">FUTUREWAVE</div>
            </div>
            <div className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <div className="h-8 md:h-10 w-24 md:w-32 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center text-xs font-semibold">NEXGEN</div>
            </div>
            <div className="grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
              <div className="h-8 md:h-10 w-24 md:w-32 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center text-xs font-semibold">INNOVATECH</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
