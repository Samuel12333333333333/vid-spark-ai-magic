
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/ui/spinner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get auth code from URL
    const handleAuthCallback = async () => {
      try {
        // Process the authentication callback
        // This component is rendered when the OAuth provider redirects back to our app
        console.log("Processing auth callback...");

        // This delays navigation by a bit to allow auth state update to complete
        setTimeout(() => {
          // Check if we have a session
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              console.log("Session exists, redirecting to dashboard");
              navigate("/dashboard");
            } else {
              console.log("No session found, redirecting to login");
              setError("Authentication failed. Please try again.");
              navigate("/login");
            }
          });
        }, 1000);
      } catch (err) {
        console.error("Error handling auth callback:", err);
        setError("An error occurred during authentication. Please try again.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        {error ? (
          <div className="text-red-500">
            <p>{error}</p>
            <button
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => navigate("/login")}
            >
              Return to login
            </button>
          </div>
        ) : (
          <>
            <Spinner size="lg" />
            <h1 className="mt-4 text-xl font-semibold">Completing authentication...</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Please wait while we sign you in.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
