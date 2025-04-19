
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="py-20 md:py-28 lg:py-32 relative overflow-hidden bg-gradient-to-b from-background to-background/80">
      {/* Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 md:px-6 relative">
        <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm bg-card">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI-Powered Video Creation</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-secondary">
            Turn Text Into Videos
            <br />
            <span className="text-foreground">in Minutes</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-[42rem] leading-relaxed">
            SmartVid uses AI to instantly turn your ideas into professional, engaging videos. 
            No technical skills required — just type and watch the magic happen.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white h-12 px-8" asChild>
              <Link to="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8" asChild>
              <Link to="#how-it-works">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground pt-4">
            <div className="flex items-center">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary mr-2">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary mr-2">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              <span>Free plan available</span>
            </div>
            <div className="flex items-center">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary mr-2">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
