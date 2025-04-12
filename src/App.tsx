import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { HelmetProvider } from "react-helmet-async";

// Layouts
import { DashboardLayout } from "@/layouts/DashboardLayout";

// Public Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

// Dashboard Pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import VideosPage from "./pages/dashboard/VideosPage";
import TemplatesPage from "./pages/dashboard/TemplatesPage";
import ScriptsPage from "./pages/dashboard/ScriptsPage";
import GeneratorPage from "./pages/dashboard/GeneratorPage";
import BrandKitPage from "./pages/dashboard/BrandKitPage";
import SettingsPage from "./pages/dashboard/SettingsPage";

// Protected Route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { session, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const queryClient = new QueryClient();

const App = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HelmetProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />
                
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
                  <Route path="templates" element={<TemplatesPage />} />
                  <Route path="scripts" element={<ScriptsPage />} />
                  <Route path="generator" element={<GeneratorPage />} />
                  <Route path="brand" element={<BrandKitPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </HelmetProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
