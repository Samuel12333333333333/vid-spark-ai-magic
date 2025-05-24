
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ThemeProvider } from "@/components/ThemeProvider";

const queryClient = new QueryClient();

// Lazy load components
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const AuthCallback = lazy(() => import("@/pages/auth/AuthCallback"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Dashboard layout and pages
const DashboardLayout = lazy(() => import("@/layouts/DashboardLayout"));
const DashboardHome = lazy(() => import("@/pages/dashboard/DashboardHome"));
const GeneratorPage = lazy(() => import("@/pages/dashboard/GeneratorPage"));
const VideosPage = lazy(() => import("@/pages/dashboard/VideosPage"));
const TemplatesPage = lazy(() => import("@/pages/dashboard/TemplatesPage"));
const SettingsPage = lazy(() => import("@/pages/dashboard/SettingsPage"));
const ScriptsPage = lazy(() => import("@/pages/dashboard/ScriptsPage"));

// Product pages
const ProductOverviewPage = lazy(() => import("@/pages/product/ProductOverviewPage"));
const FeaturesPage = lazy(() => import("@/pages/product/FeaturesPage"));
const IntegrationsPage = lazy(() => import("@/pages/product/IntegrationsPage"));
const UseCasesPage = lazy(() => import("@/pages/product/UseCasesPage"));

// Other pages
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));

// Admin pages
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminRenderLogsPage = lazy(() => import("@/pages/admin/AdminRenderLogsPage"));

// Community and Help pages
const CommunityPage = lazy(() => import("@/pages/resources/CommunityPage"));
const HelpCenterPage = lazy(() => import("@/pages/resources/HelpCenterPage"));

// Main Layout for public pages
const MainLayout = lazy(() => import("@/components/layout/MainLayout"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="smartvid-theme">
        <TooltipProvider>
          <AuthProvider>
            <AdminProvider>
              <SubscriptionProvider>
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
                          <Route path="product" element={<ProductOverviewPage />} />
                          <Route path="features" element={<FeaturesPage />} />
                          <Route path="pricing" element={<PricingPage />} />
                          <Route path="integrations" element={<IntegrationsPage />} />
                          <Route path="use-cases" element={<UseCasesPage />} />
                          <Route path="about" element={<AboutPage />} />
                          <Route path="contact" element={<ContactPage />} />
                          <Route path="terms" element={<TermsPage />} />
                          <Route path="privacy" element={<PrivacyPage />} />
                          <Route path="community" element={<CommunityPage />} />
                          <Route path="help" element={<HelpCenterPage />} />
                        </Route>
                        
                        {/* Auth routes without layout */}
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route path="/login" element={<AuthPage />} />
                        <Route path="/register" element={<AuthPage />} />
                        
                        {/* Dashboard routes with DashboardLayout */}
                        <Route path="/dashboard" element={<DashboardLayout />}>
                          <Route index element={<DashboardHome />} />
                          <Route path="generator" element={<GeneratorPage />} />
                          <Route path="videos" element={<VideosPage />} />
                          <Route path="templates" element={<TemplatesPage />} />
                          <Route path="settings" element={<SettingsPage />} />
                          <Route path="scripts" element={<ScriptsPage />} />
                        </Route>
                        
                        {/* Admin routes */}
                        <Route path="/admin" element={<AdminDashboardPage />} />
                        <Route path="/admin/users" element={<AdminUsersPage />} />
                        <Route path="/admin/renders" element={<AdminRenderLogsPage />} />
                        
                        {/* 404 */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </div>
                </Router>
                <Toaster />
              </SubscriptionProvider>
            </AdminProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
