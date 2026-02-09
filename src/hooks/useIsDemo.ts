import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEMO_EMAIL = "demo@gestbarber.com";

export const useIsDemo = () => {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsDemo(user?.email === DEMO_EMAIL);
    });
  }, []);

  return isDemo;
};
