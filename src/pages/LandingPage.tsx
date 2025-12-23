import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CaseStudiesSection } from "@/components/landing/CaseStudiesSection";
import { PerformanceMetricsSection } from "@/components/landing/PerformanceMetricsSection";
import { AwardsSection } from "@/components/landing/AwardsSection";
import { DemoVideo } from "@/components/product/DemoVideo";
import { Button } from "@/components/ui/button";
import SEOMetadata from "@/components/SEOMetadata";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const demoSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    // Check if there's a hash in the URL, and scroll to that section
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <SEOMetadata
        title="AI-Powered Video Generator"
        description="Transform your text into stunning videos in minutes with Smart Videofy's AI technology. No design skills required. Create professional videos for marketing, education, and social media. Start free today."
        keywords="AI video generator, text to video, video creation, AI video maker, Smart Videofy, automated video creation, video marketing, social media videos"
        canonicalUrl="/"
        ogType="website"
      />
      <HeroSection />
      <PerformanceMetricsSection />

      {/* Demo Video Section */}
      <section id="demo-section" className="py-16 md:py-24 bg-muted/50" ref={demoSectionRef}>
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              See Smart Videofy in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch how easily you can transform plain text into professional videos
              with just a few clicks using our AI-powered platform.
            </p>
          </motion.div>
          <DemoVideo />
        </div>
      </section>

      <FeaturesSection />
      <TestimonialsSection />
      <CaseStudiesSection />
      <AwardsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />

      {/* Scroll to top button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: isScrolled ? 1 : 0,
          scale: isScrolled ? 1 : 0.5,
          pointerEvents: isScrolled ? 'auto' : 'none'
        }}
        transition={{ duration: 0.3 }}
      >
        <Button
          size="icon"
          className="rounded-full w-12 h-12 bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </Button>
      </motion.div>

      {/* Social proof floating toast */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 5, duration: 0.5 }}
        className="fixed bottom-6 left-6 z-50 bg-card rounded-lg shadow-lg p-4 max-w-xs border"
      >
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">Alex from New York</p>
            <p className="text-xs text-muted-foreground">Just created a new video!</p>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground ml-auto"
            onClick={() => document.querySelector('.fixed.bottom-6.left-6')?.classList.add('hidden')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </motion.div>
    </>
  );
}
