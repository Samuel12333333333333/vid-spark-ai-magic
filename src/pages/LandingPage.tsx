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
import { ChatBubble } from "@/components/landing/ChatBubble";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-tl from-[#fdfbfb] via-[#ebedee] to-[#dfe9f3] dark:from-gray-900 dark:via-gray-950 dark:to-black">
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
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
              <Button variant="ghost" asChild className="text-sm font-medium transition-colors duration-300">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button className="bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105" asChild>
                <Link to="/register">Sign Up</Link>
              </Button>
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
                <Button variant="outline" asChild className="w-full">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                </Button>
                <Button className="bg-primary hover:bg-primary/90 w-full" asChild>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </motion.header>

      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
        <ChatBubble />
      </main>

      <Footer />
    </div>
  );
}
