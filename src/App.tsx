
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { HelmetProvider } from "react-helmet-async";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Layouts
import MainLayout from "@/components/layout/MainLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";

// Public Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import AuthCallback from "./pages/auth/AuthCallback";
import NotFound from "./pages/NotFound";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ProductOverviewPage from "./pages/product/ProductOverviewPage";
import FeaturesPage from "./pages/product/FeaturesPage";
import IntegrationsPage from "./pages/product/IntegrationsPage";
import UseCasesPage from "./pages/product/UseCasesPage";
import BlogPage from "./pages/resources/BlogPage";
import BlogPostPage from "./pages/blog/[slug]";
import HelpCenterPage from "./pages/resources/HelpCenterPage";
import CommunityPage from "./pages/resources/CommunityPage";
import APIDocsPage from "./pages/resources/APIDocsPage";
import CareersPage from "./pages/company/CareersPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import CookiesPage from "./pages/CookiesPage";
import PricingPage from "./pages/PricingPage";
import SitemapPage from "./pages/SitemapPage";

// Dashboard Pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import VideosPage from "./pages/dashboard/VideosPage";
import VideoDetailPage from "./pages/dashboard/VideoDetailPage";
import TemplatesPage from "./pages/dashboard/TemplatesPage";
import ScriptsPage from "./pages/dashboard/ScriptsPage";
import GeneratorPage from "./pages/dashboard/GeneratorPage";
import BrandKitPage from "./pages/dashboard/BrandKitPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import UpgradePage from "./pages/dashboard/UpgradePage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";

// Protected Route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { session, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SubscriptionProvider>
            <HelmetProvider>
              <TooltipProvider>
                <ToastProvider>
                  <ToastViewport />
                </ToastProvider>
                <Sonner position="top-right" closeButton />
                <ErrorBoundary>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/register" element={<AuthPage />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    
                    {/* Payment success page - public but typically accessed after payment */}
                    <Route path="/payment-success" element={<PaymentSuccessPage />} />
                    
                    {/* HTML Sitemap page */}
                    <Route path="/sitemap" element={<SitemapPage />} />
                    
                    {/* New marketing pages with MainLayout */}
                    <Route element={<MainLayout />}>
                      <Route path="/product" element={<ProductOverviewPage />} />
                      <Route path="/features" element={<FeaturesPage />} />
                      <Route path="/pricing" element={<PricingPage />} />
                      <Route path="/templates" element={<TemplatesPage />} />
                      <Route path="/integrations" element={<IntegrationsPage />} />
                      <Route path="/use-cases" element={<UseCasesPage />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogPostPage />} />
                      <Route path="/help" element={<HelpCenterPage />} />
                      <Route path="/community" element={<CommunityPage />} />
                      <Route path="/api-docs" element={<APIDocsPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/careers" element={<CareersPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/privacy" element={<PrivacyPage />} />
                      <Route path="/terms" element={<TermsPage />} />
                      <Route path="/cookies" element={<CookiesPage />} />
                    </Route>
                    
                    {/* Dashboard Routes - Protected */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<DashboardHome />} />
                      <Route path="videos" element={<VideosPage />} />
                      <Route path="videos/:id" element={<VideoDetailPage />} />
                      <Route path="templates" element={<TemplatesPage />} />
                      <Route path="scripts" element={<ScriptsPage />} />
                      <Route path="generator" element={<GeneratorPage />} />
                      <Route path="brand" element={<BrandKitPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="upgrade" element={<UpgradePage />} />
                      <Route path="notifications" element={<NotificationsPage />} />
                    </Route>
                    
                    {/* 404 Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </TooltipProvider>
            </HelmetProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
