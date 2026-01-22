import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type BookingStep = "start" | "date" | "time" | "service" | "barber" | "confirm" | "completed";

/**
 * Hook para rastrear tentativas de agendamento e detectar abandonos
 * Usado para disparar o gatilho TRIGGER_ABANDONED_BOOKING
 */
export const useBookingAttemptTracker = () => {
  const sessionIdRef = useRef<string | null>(null);
  const attemptIdRef = useRef<string | null>(null);

  // Gerar ID único para sessão
  const generateSessionId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Iniciar rastreamento de tentativa de agendamento
  const startBookingAttempt = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const sessionId = generateSessionId();
      sessionIdRef.current = sessionId;

      const { data, error } = await supabase
        .from("booking_attempts")
        .insert({
          user_id: user.id,
          session_id: sessionId,
          step_reached: "start",
          device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error starting booking attempt:", error);
        return null;
      }

      attemptIdRef.current = data.id;
      return data.id;
    } catch (error) {
      console.error("Error in startBookingAttempt:", error);
      return null;
    }
  }, []);

  // Atualizar progresso da tentativa
  const updateBookingStep = useCallback(async (step: BookingStep) => {
    if (!attemptIdRef.current) return;

    try {
      const updateData: Record<string, any> = {
        step_reached: step,
      };

      // Se completou, marcar como completed
      if (step === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      await supabase
        .from("booking_attempts")
        .update(updateData)
        .eq("id", attemptIdRef.current);
    } catch (error) {
      console.error("Error updating booking step:", error);
    }
  }, []);

  // Marcar como abandonado (chamado quando usuário sai da página)
  const markAsAbandoned = useCallback(async () => {
    if (!attemptIdRef.current) return;

    try {
      // Verificar se já foi completado
      const { data } = await supabase
        .from("booking_attempts")
        .select("completed_at")
        .eq("id", attemptIdRef.current)
        .single();

      // Só marcar como abandonado se não foi completado
      if (!data?.completed_at) {
        await supabase
          .from("booking_attempts")
          .update({
            abandoned_at: new Date().toISOString(),
          })
          .eq("id", attemptIdRef.current);
      }
    } catch (error) {
      console.error("Error marking booking as abandoned:", error);
    }
  }, []);

  // Completar tentativa com sucesso
  const completeBookingAttempt = useCallback(async () => {
    await updateBookingStep("completed");
    attemptIdRef.current = null;
    sessionIdRef.current = null;
  }, [updateBookingStep]);

  return {
    startBookingAttempt,
    updateBookingStep,
    markAsAbandoned,
    completeBookingAttempt,
  };
};
