
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

// Dashboard layout and pages
const DashboardLayout = lazy(() => import("@/layouts/DashboardLayout"));
const DashboardHome = lazy(() => import("@/pages/dashboard/DashboardHome"));
const GeneratorPage = lazy(() => import("@/pages/dashboard/GeneratorPage"));
const VideosPage = lazy(() => import("@/pages/dashboard/VideosPage"));
const TemplatesPage = lazy(() => import("@/pages/dashboard/TemplatesPage"));
const SettingsPage = lazy(() => import("@/pages/dashboard/SettingsPage"));
const ScriptsPage = lazy(() => import("@/pages/dashboard/ScriptsPage"));

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
