/**
 * Hook para gerenciar cooldown de triggers
 */
import { useCallback } from "react";
import { TriggerType, TRIGGER_STORAGE_KEY, TRIGGER_COOLDOWN_MS } from "./types";

export const useTriggerCooldown = () => {
  // 🔍 Verificar se um trigger pode ser mostrado (cooldown)
  const canShowTrigger = useCallback((type: TriggerType): boolean => {
    try {
      const stored = localStorage.getItem(TRIGGER_STORAGE_KEY);
      if (!stored) return true;

      const triggers = JSON.parse(stored) as Record<string, number>;
      const lastShown = triggers[type];
      if (!lastShown) return true;

      return Date.now() - lastShown > TRIGGER_COOLDOWN_MS;
    } catch {
      return true;
    }
  }, []);

  // 💾 Registrar trigger mostrado
  const recordTriggerShown = useCallback((type: TriggerType) => {
    try {
      const stored = localStorage.getItem(TRIGGER_STORAGE_KEY);
      const triggers = stored ? JSON.parse(stored) : {};
      triggers[type] = Date.now();
      localStorage.setItem(TRIGGER_STORAGE_KEY, JSON.stringify(triggers));
    } catch {
      // Silent fail
    }
  }, []);

  return { canShowTrigger, recordTriggerShown };
};
