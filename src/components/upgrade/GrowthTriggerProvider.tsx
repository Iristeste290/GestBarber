import { createContext, useContext, ReactNode } from "react";
import { useGrowthTriggerEngine } from "@/hooks/useGrowthTriggerEngine";
import { UpgradeModal } from "./UpgradeModal";
import type { TriggerType, UpgradeTrigger, GrowthMetrics } from "@/hooks/useGrowthTriggerEngine";

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
      <UpgradeModal
        trigger={activeTrigger}
        isOpen={isModalOpen}
        onClose={dismissTrigger}
        eventId={activeEventId || undefined}
      />
    </GrowthTriggerContext.Provider>
  );
};
