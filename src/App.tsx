import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { HelmetProvider } from "react-helmet-async";

// Layouts
import MainLayout from "@/components/layout/MainLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";

// Public Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ProductOverviewPage from "./pages/product/ProductOverviewPage";

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
          <SubscriptionProvider>
            <HelmetProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  
                  {/* New marketing pages with MainLayout */}
                  <Route element={<MainLayout />}>
                    <Route path="/product" element={<ProductOverviewPage />} />
                    {/* Other marketing pages will be added here */}
                  </Route>
                  
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/register" element={<AuthPage />} />
                  <Route path="/payment-success" element={<PaymentSuccessPage />} />
                  
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
                  </Route>
                  
                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </HelmetProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
