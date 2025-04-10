
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
