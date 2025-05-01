import { useLocation } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "react-router-dom";

export default function AuthPage() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex">
        {/* Left side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="flex justify-between items-center mb-8">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-xl font-bold text-smartvid-600">SmartVid</span>
              </Link>
              <ThemeToggle />
            </div>
            
            <AuthForm defaultMode={isLoginPage ? "login" : "register"} />
          </div>
        </div>
        
        {/* Right side - Image/Decoration */}
        <div className="hidden lg:block w-1/2 bg-gray-900 dark:bg-black relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 opacity-90"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
            <img
              src="/lovable-uploads/e8a25181-6ae2-4a00-bcd6-c668ef806534.png"
              alt="SmartVid AI Video Generation"
              className="w-full max-w-2xl mx-auto mb-8 drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
