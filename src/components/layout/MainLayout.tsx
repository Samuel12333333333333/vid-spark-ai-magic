
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MainHeader } from './MainHeader';
import Footer from './Footer';
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function MainLayout() {
  const { pathname, hash } = useLocation();

  // Scroll to top on route change unless there's a hash
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      // If there's a hash, scroll to that element after a short delay
      // to ensure the DOM has been fully updated
      setTimeout(() => {
        const element = document.getElementById(hash.slice(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [pathname, hash]);

  return (
    <div className="min-h-screen flex flex-col">
      <MainHeader />
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <Toaster position="top-right" closeButton richColors />
    </div>
  );
}
