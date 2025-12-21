
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";

const queryClient = new QueryClient();

// Lazy load components
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const AuthCallback = lazy(() => import("@/pages/auth/AuthCallback"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));

// Product pages
const ProductPage = lazy(() => import("@/pages/product/ProductPage"));
const FeaturesPage = lazy(() => import("@/pages/FeaturesPage"));
const TemplatesPage = lazy(() => import("@/pages/TemplatesPage"));
const IntegrationsPage = lazy(() => import("@/pages/IntegrationsPage"));
const AIToolsPage = lazy(() => import("@/pages/AIToolsPage"));

// Resource pages
const BlogPage = lazy(() => import("@/pages/resources/BlogPage"));
const BlogPostPage = lazy(() => import("@/pages/blog/[slug]"));
const HelpCenterPage = lazy(() => import("@/pages/resources/HelpCenterPage"));
const APIDocsPage = lazy(() => import("@/pages/resources/APIDocsPage"));
const CommunityPage = lazy(() => import("@/pages/resources/CommunityPage"));

// Company pages
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const CareersPage = lazy(() => import("@/pages/company/CareersPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const CookiesPage = lazy(() => import("@/pages/CookiesPage"));

// Dashboard layout and pages
const DashboardLayout = lazy(() => import("@/layouts/DashboardLayout"));
const DashboardHome = lazy(() => import("@/pages/dashboard/DashboardHome"));
const GeneratorPage = lazy(() => import("@/pages/dashboard/GeneratorPage"));
const VideosPage = lazy(() => import("@/pages/dashboard/VideosPage"));
const VideoDetailPage = lazy(() => import("@/pages/dashboard/VideoDetailPage"));
const TemplatesPageDashboard = lazy(() => import("@/pages/dashboard/TemplatesPage"));
const TemplateDetailPage = lazy(() => import("@/pages/dashboard/TemplateDetailPage"));
const SettingsPage = lazy(() => import("@/pages/dashboard/SettingsPage"));
const ScriptsPage = lazy(() => import("@/pages/dashboard/ScriptsPage"));
const BrandKitPage = lazy(() => import("@/pages/dashboard/BrandKitPage"));
const NotificationsPage = lazy(() => import("@/pages/dashboard/NotificationsPage"));
const UpgradePage = lazy(() => import("@/pages/dashboard/UpgradePage"));

// Admin pages
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminRenderLogsPage = lazy(() => import("@/pages/admin/AdminRenderLogsPage"));

// Main Layout for public pages
const MainLayout = lazy(() => import("@/components/layout/MainLayout"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="smartvid-theme">
        <TooltipProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-background font-sans antialiased">
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                }>
                  <Routes>
                    {/* Public routes with MainLayout */}
                    <Route path="/" element={<MainLayout />}>
                      <Route index element={<LandingPage />} />
                      <Route path="pricing" element={<PricingPage />} />
                      <Route path="contact" element={<ContactPage />} />
                      <Route path="product" element={<ProductPage />} />
                      <Route path="features" element={<FeaturesPage />} />
                      <Route path="templates" element={<TemplatesPage />} />
                      <Route path="integrations" element={<IntegrationsPage />} />
                      <Route path="ai-tools" element={<AIToolsPage />} />
                      
                      {/* Resource pages */}
                      <Route path="blog" element={<BlogPage />} />
                      <Route path="blog/:slug" element={<BlogPostPage />} />
                      <Route path="help" element={<HelpCenterPage />} />
                      <Route path="api-docs" element={<APIDocsPage />} />
                      <Route path="community" element={<CommunityPage />} />
                      
                      {/* Company pages */}
                      <Route path="about" element={<AboutPage />} />
                      <Route path="careers" element={<CareersPage />} />
                      <Route path="terms" element={<TermsPage />} />
                      <Route path="privacy" element={<PrivacyPage />} />
                      <Route path="cookies" element={<CookiesPage />} />
                    </Route>
                    
                    {/* Auth routes without layout */}
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/register" element={<AuthPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    
                    {/* Dashboard routes with DashboardLayout */}
                    <Route path="/dashboard" element={<DashboardLayout />}>
                      <Route index element={<DashboardHome />} />
                      <Route path="generator" element={<GeneratorPage />} />
                      <Route path="videos" element={<VideosPage />} />
                      <Route path="videos/:id" element={<VideoDetailPage />} />
                      <Route path="templates" element={<TemplatesPageDashboard />} />
                      <Route path="templates/:id" element={<TemplateDetailPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="scripts" element={<ScriptsPage />} />
                      <Route path="brand-kit" element={<BrandKitPage />} />
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="upgrade" element={<UpgradePage />} />
                    </Route>
                    
                    {/* Admin routes */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboardPage />} />
                      <Route path="users" element={<AdminUsersPage />} />
                      <Route path="render-logs" element={<AdminRenderLogsPage />} />
                    </Route>
                    
                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
            </Router>
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
