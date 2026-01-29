/**
 * Growth Trigger Engine - Hook Principal
 * Refatorado para melhor manutenibilidade (P2 FIX)
 * 
 * Módulos separados em /growth-triggers/:
 * - types.ts - Tipos e interfaces
 * - useTriggerCooldown.ts - Gerenciamento de cooldown
 * - useTriggerEvaluator.ts - Avaliação de triggers
 * - useGrowthMetrics.ts - Fetch de métricas
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlanValidation } from "./usePlanValidation";
import { logTriggerEvent } from "./useUpgradeTriggerAnalytics";
import { 
  TriggerType, 
  UpgradeTrigger, 
  GrowthMetrics 
} from "./growth-triggers/types";
import { useTriggerEvaluator } from "./growth-triggers/useTriggerEvaluator";
import { useGrowthMetrics } from "./growth-triggers/useGrowthMetrics";

// Re-export types for backward compatibility
export type { TriggerType, UpgradeTrigger, GrowthMetrics };

export const useGrowthTriggerEngine = () => {
  const { isGrowth, isStart, loading: planLoading } = usePlanValidation();
  const [activeTrigger, setActiveTrigger] = useState<UpgradeTrigger | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggeredRef = useRef(false);

  // 📊 Buscar métricas (módulo separado)
  const { data: metrics, refetch: refetchMetrics } = useGrowthMetrics(isStart, planLoading);

  // 🎯 Avaliador de triggers (módulo separado)
  const { evaluateTriggers, recordTriggerShown } = useTriggerEvaluator(
    metrics,
    isStart,
    planLoading
  );

  // 🚫 TRIGGER_FEATURE_BLOCK - Tentativa de acessar função premium
  const triggerFeatureBlock = useCallback(async (featureName: string) => {
    if (!isStart || isGrowth) return;

    const trigger: UpgradeTrigger = {
      type: "TRIGGER_FEATURE_BLOCK",
      message: `"${featureName}" é uma ferramenta do plano Growth que pode aumentar seu faturamento. Desbloqueie e pare de perder dinheiro.`,
      featureName,
      priority: 0,
    };

    setActiveTrigger(trigger);
    setIsModalOpen(true);
    recordTriggerShown("TRIGGER_FEATURE_BLOCK");
    
    // Log trigger event for analytics
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      logTriggerEvent(user.id, "TRIGGER_FEATURE_BLOCK", trigger.message, {});
    }
  }, [isStart, isGrowth, recordTriggerShown]);

  // 🔄 Rodar avaliação de triggers automaticamente
  useEffect(() => {
    if (planLoading || !isStart || triggeredRef.current) return;
    
    const trigger = evaluateTriggers();
    if (trigger) {
      // Delay de 3s para não aparecer imediatamente
      const timer = setTimeout(async () => {
        setActiveTrigger(trigger);
        setIsModalOpen(true);
        recordTriggerShown(trigger.type);
        triggeredRef.current = true;
        
        // Log trigger event for analytics
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const eventId = await logTriggerEvent(user.id, trigger.type, trigger.message, {
            lostMoney: trigger.lostMoney,
            lostClients: trigger.lostClients,
            abandonedBookings: trigger.abandonedBookings,
            manualTimeMinutes: trigger.manualTimeMinutes,
            noShowCount: trigger.noShowCount,
            potentialRevenue: trigger.potentialRevenue,
          });
          if (eventId) setActiveEventId(eventId);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [metrics, planLoading, isStart, evaluateTriggers, recordTriggerShown]);

  // 🎯 Fechar modal
  const dismissTrigger = useCallback(() => {
    setIsModalOpen(false);
    setActiveTrigger(null);
  }, []);

  // 🔄 Forçar re-avaliação
  const checkTriggers = useCallback(() => {
    triggeredRef.current = false;
    refetchMetrics();
  }, [refetchMetrics]);

  return {
    // Estado
    activeTrigger,
    activeEventId,
    isModalOpen,
    metrics,
    isStart,
    isGrowth,
    
    // Ações
    dismissTrigger,
    triggerFeatureBlock,
    checkTriggers,
    refetchMetrics,
  };
};

// Hook simplificado para acesso rápido ao trigger de feature block
export const useFeatureBlockTrigger = () => {
  const { triggerFeatureBlock, isStart, isGrowth } = useGrowthTriggerEngine();
  
  return {
    triggerFeatureBlock,
    shouldBlock: isStart && !isGrowth,
  };
};
