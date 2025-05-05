
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { CaseStudiesSection } from "@/components/landing/CaseStudiesSection";
import { PerformanceMetricsSection } from "@/components/landing/PerformanceMetricsSection";
import { AwardsSection } from "@/components/landing/AwardsSection";
import { DemoVideo } from "@/components/product/DemoVideo";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const { session } = useAuth();
  const demoSectionRef = useRef<HTMLDivElement>(null);

  // Enhanced scroll effects
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [0.6, 1]);
  
  useEffect(() => {
    // Scroll effect for header
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      
      // Get current scroll position
      const scrollPosition = window.scrollY + window.innerHeight * 0.3;
      
      // Check which section is currently visible
      document.querySelectorAll('section[id]').forEach(section => {
        const sectionTop = (section as HTMLElement).offsetTop;
        const sectionHeight = (section as HTMLElement).offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          setActiveSection((section as HTMLElement).id);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    // Initial call to set state on mount
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

  // Determine where navigation buttons should lead based on authentication status
  const getNavigationDestination = () => {
    return session ? "/dashboard" : "/login";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-tl from-[#fdfbfb] via-[#ebedee] to-[#dfe9f3] dark:from-gray-900 dark:via-gray-950 dark:to-black">
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ opacity: headerOpacity }}
        className={`
          sticky top-0 z-40 w-full
          transition-all duration-300 ease-in-out
          ${isScrolled
            ? 'bg-white/80 backdrop-blur-lg dark:bg-gray-900/80 shadow-md border-b border-gray-200 dark:border-gray-800'
            : 'bg-transparent border-transparent'}
        `}
      >
        <div className="container flex h-16 items-center justify-between py-4">
          <Link
            to="/"
            className="flex items-center space-x-2 transition-transform duration-300 hover:scale-105"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="m22 8-6 4 6 4V8Z" />
              <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
            </svg>
            <span className="text-xl font-bold text-gray-900 dark:text-white">SmartVid</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:flex gap-3">
              {session ? (
                <Button className="bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild className="text-sm font-medium transition-colors duration-300">
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105" asChild>
                    <Link to="/register">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
            <Button
              className="md:hidden"
              variant="ghost"
              size="icon"
              aria-label="Toggle Menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" x2="20" y1="12" y2="12" />
                    <line x1="4" x2="20" y1="6" y2="6" />
                    <line x1="4" x2="20" y1="18" y2="18" />
                  </>
                )}
              </svg>
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden border-t bg-white dark:bg-gray-950 pb-6 animate-slide-in-right"
          >
            <nav className="flex flex-col space-y-4 p-4">
              <div className="flex flex-col gap-2 pt-2">
                {session ? (
                  <Button className="w-full" asChild>
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Go to Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 w-full" asChild>
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </motion.header>

      <main className="flex-1">
        <HeroSection />
        <PerformanceMetricsSection />
        
        {/* Added Demo Video Section with ID for navigation */}
        <section id="demo-section" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800/50" ref={demoSectionRef}>
          <div className="container mx-auto px-4 md:px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                See SmartVid in Action
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
      </main>

      <Footer />
      
      {/* Scroll to top button appears after scrolling down */}
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
          className="rounded-full w-12 h-12 bg-primary/90 hover:bg-primary text-white shadow-lg hover:shadow-xl transition-all"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </Button>
      </motion.div>
      
      {/* Social proof floating toast - appears after 5 seconds */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 5, duration: 0.5 }}
        className="fixed bottom-6 left-6 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs border border-gray-200 dark:border-gray-700"
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
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 ml-auto"
            onClick={() => document.querySelector('.fixed.bottom-6.left-6')?.classList.add('hidden')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
