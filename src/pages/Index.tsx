import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import LandingPage from "./LandingPage";

const VISIT_COUNT_KEY = "gestbarber_visit_count";
const VISITS_THRESHOLD = 5;

const trackRedirect = async (redirectType: 'pwa_installed' | 'frequent_visitor' | 'landing_page') => {
  try {
    await supabase.from("redirect_analytics").insert({
      redirect_type: redirectType,
      user_agent: navigator.userAgent
    });
  } catch (error) {
    console.error("Error tracking redirect:", error);
  }
};

const Index = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthAndActivation = async () => {
      try {
        // Check if running as standalone PWA (installed app)
        const isStandalone = 
          window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as any).standalone === true;

        // Track visit count - redirect frequent visitors to auth
        const currentVisits = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10);
        const newVisitCount = currentVisits + 1;
        localStorage.setItem(VISIT_COUNT_KEY, newVisitCount.toString());
        const isFrequentVisitor = newVisitCount >= VISITS_THRESHOLD;

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // If PWA installed, go directly to auth page
          if (isStandalone) {
            trackRedirect('pwa_installed');
            navigate("/auth");
            return;
          }
          // If frequent visitor, go directly to auth page
          if (isFrequentVisitor) {
            trackRedirect('frequent_visitor');
            navigate("/auth");
            return;
          }
          // Otherwise show landing page
          trackRedirect('landing_page');
          setIsAuthenticated(false);
          setIsChecking(false);
          return;
        }

        setIsAuthenticated(true);

        // Check if user has completed activation
        const { data: profile } = await supabase
          .from("profiles")
          .select("activation_completed")
          .eq("id", session.user.id)
          .single();

        if (!profile?.activation_completed) {
          navigate("/onboarding");
        } else {
          navigate("/painel");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
        setIsChecking(false);
      }
    };

    checkAuthAndActivation();
  }, [navigate]);

  if (isChecking) {
    return <FullPageLoader text="Carregando..." />;
  }

  // If not authenticated, show the landing page
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return null;
};

export default Index;
