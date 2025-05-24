
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import MainLayout from "@/components/layout/MainLayout";
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
                        {/* Public routes with MainLayout */}
                        <Route path="/" element={<MainLayout />}>
                          <Route index element={<LandingPage />} />
                          <Route path="auth" element={<AuthPage />} />
                        </Route>
                        
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
