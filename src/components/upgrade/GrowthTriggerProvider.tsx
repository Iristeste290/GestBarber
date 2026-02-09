import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useGrowthTriggerEngine } from "@/hooks/useGrowthTriggerEngine";
import { useConversionPushNotifications } from "@/hooks/useConversionPushNotifications";
import { UpgradeModal } from "./UpgradeModal";
import type { TriggerType, UpgradeTrigger, GrowthMetrics } from "@/hooks/useGrowthTriggerEngine";
import { supabase } from "@/integrations/supabase/client";

interface GrowthTriggerContextType {
  triggerFeatureBlock: (featureName: string) => void;
  checkTriggers: () => void;
  isStart: boolean;
  isGrowth: boolean;
  metrics: GrowthMetrics | null | undefined;
}

const GrowthTriggerContext = createContext<GrowthTriggerContextType | null>(null);

export const useGrowthTriggers = () => {
  const context = useContext(GrowthTriggerContext);
  if (!context) {
    throw new Error("useGrowthTriggers must be used within GrowthTriggerProvider");
  }
  return context;
};

interface GrowthTriggerProviderProps {
  children: ReactNode;
}

export const GrowthTriggerProvider = ({ children }: GrowthTriggerProviderProps) => {
  const {
    activeTrigger,
    activeEventId,
    isModalOpen,
    dismissTrigger,
    triggerFeatureBlock,
    checkTriggers,
    isStart,
    isGrowth,
    metrics,
  } = useGrowthTriggerEngine();

  const [userId, setUserId] = useState<string | undefined>();
  const [isDemo, setIsDemo] = useState(false);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setIsDemo(data.user.email === "demo@gestbarber.com");
      }
    });
  }, []);

  // Hook de push notifications (auto-trigger baseado em métricas)
  useConversionPushNotifications(userId);

  return (
    <GrowthTriggerContext.Provider
      value={{
        triggerFeatureBlock,
        checkTriggers,
        isStart,
        isGrowth,
        metrics,
      }}
    >
      {children}
      {!isDemo && (
        <UpgradeModal
          trigger={activeTrigger}
          isOpen={isModalOpen}
          onClose={dismissTrigger}
          eventId={activeEventId || undefined}
        />
      )}
    </GrowthTriggerContext.Provider>
  );
};
