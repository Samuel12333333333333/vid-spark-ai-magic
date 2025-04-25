
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MainHeader } from './MainHeader';
import Footer from './Footer';

export default function MainLayout() {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <MainHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
