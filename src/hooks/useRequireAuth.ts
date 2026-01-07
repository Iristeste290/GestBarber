import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export const useRequireAuth = (redirectTo: string = "/") => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // First: Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate(redirectTo);
        } else {
          // Check activation status (skip for onboarding page itself)
          const isOnboardingPage = location.pathname === "/onboarding";
          if (!isOnboardingPage) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("activation_completed")
              .eq("id", session.user.id)
              .single();

            if (profile && !profile.activation_completed) {
              navigate("/onboarding");
            }
          }
        }
        
        setInitialCheckDone(true);
        setLoading(false);
      } catch (error) {
        console.error("Error checking session:", error);
        if (isMounted) {
          setLoading(false);
          setInitialCheckDone(true);
        }
      }
    };

    checkSession();

    // Then: Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only redirect if initial check is done to avoid race conditions
        if (initialCheckDone && !session) {
          navigate(redirectTo);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, redirectTo, initialCheckDone, location.pathname]);

  return { user, session, loading };
};
