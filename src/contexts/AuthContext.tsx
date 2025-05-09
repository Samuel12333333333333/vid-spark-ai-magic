
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  error: Error | null;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<void>;
  signUp: (email: string, password: string, captchaToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Handle hash fragment for OAuth redirects
    const handleHashFragment = async () => {
      const hashParams = window.location.hash;
      if (hashParams && hashParams.includes('access_token')) {
        try {
          // Process the hash parameters from the OAuth redirect
          const searchParams = new URLSearchParams(hashParams.substring(1)); // Remove the # character
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');
          
          if (accessToken) {
            // Set the session with the tokens from the hash
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (error) {
              console.error("Error setting session:", error);
              setError(error);
            } else if (data?.session) {
              setSession(data.session);
              setUser(data.session.user);
            }
          }
        } catch (err) {
          console.error("Error processing OAuth redirect:", err);
        } finally {
          // Remove the hash to avoid processing it multiple times
          window.history.replaceState(null, document.title, window.location.pathname);
        }
      }
    };
    
    handleHashFragment();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(error => {
      console.error("Error getting session:", error);
      setError(error);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
        options: {
          captchaToken
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in:", error);
      setError(error as Error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, captchaToken?: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          captchaToken,
          emailRedirectTo: `${window.location.origin}/reset-password`,
          data: {
            email_confirmed: true
          }
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing up:", error);
      setError(error as Error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error signing out:", error);
      setError(error as Error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error resetting password:", error);
      setError(error as Error);
      throw error;
    }
  };

  const updatePassword = async (password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.updateUser({
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error updating password:", error);
      setError(error as Error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        isLoading: loading,
        error,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
