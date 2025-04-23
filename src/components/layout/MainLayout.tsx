
import { Outlet } from "react-router-dom";
import { MainHeader } from "@/components/layout/MainHeader";
import { Footer } from "@/components/landing/Footer";
import { useEffect } from "react";

export default function MainLayout() {
  // Effect to ping Google Search Console when deployed to production
  useEffect(() => {
    // Only run in production environment
    if (window.location.hostname === 'smartvideofy.com') {
      const submitSitemapToGSC = async () => {
        try {
          // Google Search Console sitemap submission ping URL
          const gscPingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent('https://smartvideofy.com/sitemap.xml')}`;
          
          // Ping Google Search Console
          await fetch(gscPingUrl, { mode: 'no-cors' });
          console.log('Sitemap submitted to Google Search Console');
        } catch (error) {
          console.error('Failed to submit sitemap:', error);
        }
      };
      
      // Submit sitemap on mount
      submitSitemapToGSC();
      
      // Set up a weekly resubmission
      const interval = setInterval(submitSitemapToGSC, 7 * 24 * 60 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      <MainHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      {/* Only one footer here, remove it from individual pages */}
      <Footer />
    </div>
  );
}
