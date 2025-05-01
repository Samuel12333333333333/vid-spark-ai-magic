
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
        <div className="hidden lg:block w-1/2 bg-smartvid-600 dark:bg-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-smartvid-600 to-smartvid-purple dark:from-gray-900 dark:to-smartvid-900 opacity-90"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
            <h2 className="text-3xl font-bold mb-6">Transform Text Into Videos with AI</h2>
            <p className="text-xl mb-8 max-w-md text-center">
              Create professional videos from text prompts in minutes, not hours. Perfect for marketers, educators, and content creators.
            </p>
            <div className="w-full max-w-md aspect-video rounded-lg overflow-hidden shadow-xl border border-white/20">
              <img 
                src="/placeholder.svg" 
                alt="SmartVid Demo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
