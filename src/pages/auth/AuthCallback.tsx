
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Processing auth callback...");
        console.log("Current location:", location);
        
        // Check for error in URL
        const queryParams = new URLSearchParams(location.search);
        const errorParam = queryParams.get('error');
        const errorDescription = queryParams.get('error_description');
        
        if (errorParam) {
          console.error("Auth error:", errorParam, errorDescription);
          setError(`Authentication error: ${errorDescription || errorParam}`);
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        // Handle hash fragment for OAuth redirects - with safety checks
        if (location.hash && location.hash.length > 1) {
          try {
            console.log("Found hash parameters:", location.hash);
            
            // Process the hash parameters from the OAuth redirect - safely
            const hashParams = new URLSearchParams(location.hash.substring(1)); // Remove the # character
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            
            if (accessToken && refreshToken) {
              console.log("Setting session with tokens from hash");
              // Set the session with the tokens from the hash
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (error) {
                console.error("Error setting session:", error);
                setError(`Error setting session: ${error.message}`);
                toast.error(`Authentication failed: ${error.message}`);
              } else if (data?.session) {
                console.log("Session set successfully");
                toast.success("Successfully signed in!");
                navigate("/dashboard");
                return;
              }
            } else {
              console.error("Missing tokens in hash");
              setError("Missing authentication tokens. Please try again.");
            }
          } catch (err) {
            console.error("Error processing hash:", err);
            setError("Error processing authentication response. Please try again.");
          }
        }

        // Check for a valid session if there's no hash or error processing it
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Valid session found, redirecting to dashboard");
          navigate("/dashboard");
        } else {
          console.log("No valid session found, redirecting to login");
          setError("Authentication failed. Please try again.");
          setTimeout(() => navigate("/login"), 2000);
        }
      } catch (err) {
        console.error("Error in auth callback:", err);
        setError("An unexpected error occurred. Please try again.");
        setTimeout(() => navigate("/login"), 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        {isProcessing ? (
          <div className="text-center">
            <Spinner size="lg" />
            <h1 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Completing authentication...
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Please wait while we sign you in.
            </p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
                />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-semibold text-red-600">Authentication Error</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
            <button
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={() => navigate("/login")}
            >
              Return to login
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <h1 className="mt-4 text-xl font-semibold text-green-600">Success!</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              You've been successfully authenticated. Redirecting...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
