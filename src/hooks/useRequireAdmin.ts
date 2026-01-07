import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export function useRequireAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Server-side verification using edge function
    const verifyAdminServerSide = async (): Promise<boolean> => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-admin');
        
        if (error) {
          console.error('Server-side admin verification failed:', error);
          return false;
        }
        
        console.log('Server-side admin verification:', data);
        return data?.isAdmin === true;
      } catch (err) {
        console.error('Error calling verify-admin function:', err);
        return false;
      }
    };

    const checkAdminAccess = async (userId: string) => {
      // First, do client-side check for quick feedback
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error || !data) {
        console.log("Client-side: User is not an admin");
        navigate("/acesso-negado", { replace: true });
        return false;
      }
      
      // Then verify server-side for extra security
      const serverVerified = await verifyAdminServerSide();
      
      if (!serverVerified) {
        console.log("Server-side: Admin verification failed");
        navigate("/acesso-negado", { replace: true });
        return false;
      }
      
      console.log("Admin access verified (client + server)");
      return true;
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth", { replace: true });
          setLoading(false);
          return;
        }

        // Defer admin check with setTimeout to avoid deadlock
        setTimeout(async () => {
          const hasAccess = await checkAdminAccess(session.user.id);
          setIsAdmin(hasAccess);
          setLoading(false);
        }, 0);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        navigate("/auth", { replace: true });
        setLoading(false);
        return;
      }

      checkAdminAccess(session.user.id).then((hasAccess) => {
        setIsAdmin(hasAccess);
        setLoading(false);
      });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return { user, session, loading, isAdmin };
}
