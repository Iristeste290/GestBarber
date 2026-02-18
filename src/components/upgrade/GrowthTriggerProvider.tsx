import React from "react";
import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from "react";
import { useGrowthTriggerEngine } from "@/hooks/useGrowthTriggerEngine";
import { useConversionPushNotifications } from "@/hooks/useConversionPushNotifications";
import { UpgradeToast, canShowUpgradeToast, recordUpgradeToastShown } from "./UpgradeToast";
import { UpgradeFullScreenModal } from "./UpgradeFullScreenModal";
import type { GrowthMetrics } from "@/hooks/useGrowthTriggerEngine";
import { supabase } from "@/integrations/supabase/client";
import { useIsDemo } from "@/hooks/useIsDemo";

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
  const isDemo = useIsDemo();
  const {
    activeTrigger,
    activeEventId,
    isModalOpen,
    dismissTrigger,
    triggerFeatureBlock: engineTriggerFeatureBlock,
    checkTriggers,
    isStart,
    isGrowth,
    metrics,
  } = useGrowthTriggerEngine();

  // Estado do sistema em 2 etapas
  const [toastOpen, setToastOpen] = useState(false);
  const [fullModalOpen, setFullModalOpen] = useState(false);
  const [currentFeatureName, setCurrentFeatureName] = useState<string | undefined>();

  // Push notifications user id
  const [userId, setUserId] = React.useState<string | undefined>();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  useConversionPushNotifications(isDemo ? undefined : userId);

  // Quando o engine dispara um trigger automático → mostrar toast
  useEffect(() => {
    if (!isDemo && isModalOpen && activeTrigger && !fullModalOpen) {
      if (canShowUpgradeToast()) {
        setToastOpen(true);
        recordUpgradeToastShown();
      }
    }
  }, [isModalOpen, activeTrigger, isDemo, fullModalOpen]);

  // Feature block → toast imediato
  const triggerFeatureBlock = useCallback((featureName: string) => {
    engineTriggerFeatureBlock(featureName);
    setCurrentFeatureName(featureName);
    if (canShowUpgradeToast()) {
      setToastOpen(true);
      recordUpgradeToastShown();
    } else {
      // Se cooldown ativo, abrir direto no full modal
      setFullModalOpen(true);
    }
  }, [engineTriggerFeatureBlock]);

  const handleToastExpand = () => {
    setToastOpen(false);
    setFullModalOpen(true);
  };

  const handleToastDismiss = () => {
    setToastOpen(false);
    dismissTrigger();
  };

  const handleFullModalClose = () => {
    setFullModalOpen(false);
    dismissTrigger();
  };

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

      {/* Etapa 1: Toast compacto */}
      {!isDemo && (
        <UpgradeToast
          isOpen={toastOpen}
          featureName={currentFeatureName}
          onDismiss={handleToastDismiss}
          onExpand={handleToastExpand}
        />
      )}

      {/* Etapa 2: Modal full screen */}
      {!isDemo && (
        <UpgradeFullScreenModal
          isOpen={fullModalOpen}
          onClose={handleFullModalClose}
          featureName={currentFeatureName}
          triggerMessage={activeTrigger?.message}
          lostMoney={activeTrigger?.lostMoney}
          eventId={activeEventId || undefined}
        />
      )}
    </GrowthTriggerContext.Provider>
  );
};
