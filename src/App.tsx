
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MainHeader } from "@/components/layout/MainHeader";
import Footer from "@/components/layout/Footer";
import { DashboardLayout } from "@/layouts/DashboardLayout";

const queryClient = new QueryClient();

// Lazy load components
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const DashboardHome = lazy(() => import("@/pages/dashboard/DashboardHome"));
const GeneratorPage = lazy(() => import("@/pages/dashboard/GeneratorPage"));
const VideosPage = lazy(() => import("@/pages/dashboard/VideosPage"));
const TemplatesPage = lazy(() => import("@/pages/dashboard/TemplatesPage"));
const SettingsPage = lazy(() => import("@/pages/dashboard/SettingsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Product pages
const ProductOverviewPage = lazy(() => import("@/pages/product/ProductOverviewPage"));
const FeaturesPage = lazy(() => import("@/pages/product/FeaturesPage"));
const IntegrationsPage = lazy(() => import("@/pages/product/IntegrationsPage"));
const UseCasesPage = lazy(() => import("@/pages/product/UseCasesPage"));

// Other pages
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));

// Admin pages
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminRenderLogsPage = lazy(() => import("@/pages/admin/AdminRenderLogsPage"));

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
                        {/* Public routes with shared header/footer */}
                        <Route path="/" element={
                          <div className="min-h-screen flex flex-col">
                            <MainHeader />
                            <main className="flex-1">
                              <LandingPage />
                            </main>
                            <Footer />
                          </div>
                        } />
                        
                        <Route path="/auth" element={
                          <div className="min-h-screen">
                            <AuthPage />
                          </div>
                        } />
                        
                        <Route path="/login" element={
                          <div className="min-h-screen">
                            <AuthPage />
                          </div>
                        } />
                        
                        <Route path="/register" element={
                          <div className="min-h-screen">
                            <AuthPage />
                          </div>
                        } />
                        
                        <Route path="/product" element={
                          <div className="min-h-screen flex flex-col">
                            <MainHeader />
                            <main className="flex-1">
                              <ProductOverviewPage />
                            </main>
                            <Footer />
                          </div>
                        } />
                        
                        <Route path="/features" element={
                          <div className="min-h-screen flex flex-col">
                            <MainHeader />
                            <main className="flex-1">
                              <FeaturesPage />
                            </main>
                            <Footer />
                          </div>
                        } />
                        
                        <Route path="/pricing" element={
                          <div className="min-h-screen flex flex-col">
                            <MainHeader />
                            <main className="flex-1">
                              <PricingPage />
                            </main>
                            <Footer />
                          </div>
                        } />
                        
                        <Route path="/integrations" element={
                          <div className="min-h-screen flex flex-col">
                            <MainHeader />
                            <main className="flex-1">
                              <IntegrationsPage />
                            </main>
                            <Footer />
                          </div>
                        } />
                        
                        <Route path="/use-cases" element={
                          <div className="min-h-screen flex flex-col">
                            <MainHeader />
                            <main className="flex-1">
                              <UseCasesPage />
                            </main>
                            <Footer />
                          </div>
                        } />
                        
                        <Route path="/about" element={
                          <div className="min-h-screen flex flex-col">
                            <MainHeader />
                            <main className="flex-1">
                              <AboutPage />
                            </main>
                            <Footer />
                          </div>
                        } />
                        
                        <Route path="/contact" element={
                          <div className="min-h-screen flex flex-col">
                            <MainHeader />
                            <main className="flex-1">
                              <ContactPage />
                            </main>
                            <Footer />
                          </div>
                        } />
                        
                        <Route path="/terms" element={
                          <div className="min-h-screen flex flex-col">
                            <MainHeader />
                            <main className="flex-1">
                              <TermsPage />
                            </main>
                            <Footer />
                          </div>
                        } />
                        
                        <Route path="/privacy" element={
                          <div className="min-h-screen flex flex-col">
                            <MainHeader />
                            <main className="flex-1">
                              <PrivacyPage />
                            </main>
                            <Footer />
                          </div>
                        } />
                        
                        {/* Dashboard routes with DashboardLayout */}
                        <Route path="/dashboard" element={<DashboardLayout />}>
                          <Route index element={<DashboardHome />} />
                          <Route path="generator" element={<GeneratorPage />} />
                          <Route path="videos" element={<VideosPage />} />
                          <Route path="templates" element={<TemplatesPage />} />
                          <Route path="settings" element={<SettingsPage />} />
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
