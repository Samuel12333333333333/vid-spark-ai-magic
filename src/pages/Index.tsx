
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// The Index component serves as the entry point
// Redirect authenticated users to dashboard, others to landing page
const Index = () => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/" replace />;
};

export default Index;
