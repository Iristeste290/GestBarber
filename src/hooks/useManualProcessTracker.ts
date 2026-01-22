import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type ProcessType = "manual_appointment" | "manual_payment" | "manual_reminder" | "manual_report" | "manual_message";

/**
 * Hook para rastrear tempo gasto em processos manuais
 * Usado para disparar o gatilho TRIGGER_MANUAL_TIME
 */
export const useManualProcessTracker = () => {
  const startTimeRef = useRef<number | null>(null);
  const processTypeRef = useRef<ProcessType | null>(null);

  // Iniciar cronômetro para processo manual
  const startManualProcess = useCallback((processType: ProcessType) => {
    startTimeRef.current = Date.now();
    processTypeRef.current = processType;
  }, []);

  // Finalizar e registrar tempo do processo
  const endManualProcess = useCallback(async () => {
    if (!startTimeRef.current || !processTypeRef.current) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const endTime = Date.now();
      const durationSeconds = Math.round((endTime - startTimeRef.current) / 1000);

      // Só registrar se demorou mais de 5 segundos (evitar registros acidentais)
      if (durationSeconds >= 5) {
        await supabase.from("manual_process_logs").insert({
          user_id: user.id,
          process_type: processTypeRef.current,
          duration_seconds: durationSeconds,
        });
      }

      // Limpar referências
      startTimeRef.current = null;
      processTypeRef.current = null;
    } catch (error) {
      console.error("Error logging manual process:", error);
    }
  }, []);

  // Cancelar rastreamento (se usuário abandonar)
  const cancelManualProcess = useCallback(() => {
    startTimeRef.current = null;
    processTypeRef.current = null;
  }, []);

  // Registrar processo completo de uma vez (quando já sabemos a duração)
  const logManualProcess = useCallback(async (processType: ProcessType, durationSeconds: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("manual_process_logs").insert({
        user_id: user.id,
        process_type: processType,
        duration_seconds: durationSeconds,
      });
    } catch (error) {
      console.error("Error logging manual process:", error);
    }
  }, []);

  return {
    startManualProcess,
    endManualProcess,
    cancelManualProcess,
    logManualProcess,
  };
};
