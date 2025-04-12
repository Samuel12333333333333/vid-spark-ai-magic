
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import GeneratorPage from "@/pages/dashboard/GeneratorPage";
import VideosPage from "@/pages/dashboard/VideosPage";
import VideoDetailPage from "@/pages/dashboard/VideoDetailPage";
import TemplatesPage from "@/pages/dashboard/TemplatesPage";
import ScriptsPage from "@/pages/dashboard/ScriptsPage";
import BrandKitPage from "@/pages/dashboard/BrandKitPage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import { AuthProvider } from "@/contexts/AuthContext";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="smartvid-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="generator" element={<GeneratorPage />} />
              <Route path="videos" element={<VideosPage />} />
              <Route path="videos/:videoId" element={<VideoDetailPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="scripts" element={<ScriptsPage />} />
              <Route path="brand-kit" element={<BrandKitPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
          
          <Toaster richColors position="top-right" />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
