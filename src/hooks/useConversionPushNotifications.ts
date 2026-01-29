/**
 * Hook para disparar push notifications de conversão
 * Melhoria estratégica: Integra triggers de push nos eventos de conversão
 * 
 * Regras:
 * - Máximo 3x por semana
 * - Apenas para usuários Start
 * - Baseado em dados reais do barbeiro
 */

import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlanValidation } from "./usePlanValidation";
import { useBarbershopMetrics, formatCurrency } from "./useBarbershopMetrics";

const MAX_PUSH_PER_WEEK = 3;
const STORAGE_KEY = 'conversion-push-timestamps';

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Tipos de notificação de conversão
type ConversionPushType = 
  | 'weekly_loss'
  | 'inactive_clients'
  | 'empty_slots'
  | 'weak_week';

function getStoredTimestamps(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const timestamps = JSON.parse(stored) as number[];
    // Filtrar apenas timestamps da última semana
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return timestamps.filter(t => t > oneWeekAgo);
  } catch {
    return [];
  }
}

function storeTimestamp(timestamp: number): void {
  const timestamps = getStoredTimestamps();
  timestamps.push(timestamp);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timestamps));
}

function canSendPush(): boolean {
  const timestamps = getStoredTimestamps();
  return timestamps.length < MAX_PUSH_PER_WEEK;
}

function getRemainingPushes(): number {
  const timestamps = getStoredTimestamps();
  return Math.max(0, MAX_PUSH_PER_WEEK - timestamps.length);
}

export function useConversionPushNotifications(userId?: string) {
  const { isStart, loading: planLoading } = usePlanValidation();
  const { data: metrics } = useBarbershopMetrics();
  const hasTriggeredRef = useRef<Set<ConversionPushType>>(new Set());

  // Enviar push notification
  const sendPush = useCallback(async (payload: PushNotificationPayload): Promise<boolean> => {
    if (!userId || !canSendPush()) return false;

    try {
      const { error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          userId,
          ...payload,
        },
      });

      if (!error) {
        storeTimestamp(Date.now());
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error sending conversion push:", err);
      return false;
    }
  }, [userId]);

  // Triggers automáticos baseados em métricas
  const triggerWeeklyLossPush = useCallback(async () => {
    if (!metrics || hasTriggeredRef.current.has('weekly_loss')) return;
    if (metrics.weeklyLostRevenue < 100) return;

    hasTriggeredRef.current.add('weekly_loss');
    
    await sendPush({
      title: "💸 Você perdeu dinheiro esta semana",
      body: `${formatCurrency(metrics.weeklyLostRevenue)} em faltas e cancelamentos. Veja como recuperar com Growth!`,
      data: { type: 'weekly_loss', action: '/planos' },
    });
  }, [metrics, sendPush]);

  const triggerInactiveClientsPush = useCallback(async () => {
    if (!metrics || hasTriggeredRef.current.has('inactive_clients')) return;
    if (metrics.inactiveClientsCount < 5) return;

    hasTriggeredRef.current.add('inactive_clients');
    
    await sendPush({
      title: "👥 Clientes podem voltar",
      body: `${metrics.inactiveClientsCount} clientes inativos podem ser reativados automaticamente com Growth.`,
      data: { type: 'inactive_clients', action: '/planos' },
    });
  }, [metrics, sendPush]);

  const triggerEmptySlotsPush = useCallback(async () => {
    if (!metrics || hasTriggeredRef.current.has('empty_slots')) return;
    if (metrics.weeklyEmptySlots < 5) return;

    hasTriggeredRef.current.add('empty_slots');
    const potentialRevenue = metrics.weeklyEmptySlots * metrics.avgTicket;
    
    await sendPush({
      title: "📅 Horários vazios detectados",
      body: `${metrics.weeklyEmptySlots} horários sem clientes = ${formatCurrency(potentialRevenue)} parados. Preencha com Growth!`,
      data: { type: 'empty_slots', action: '/planos' },
    });
  }, [metrics, sendPush]);

  const triggerWeakWeekPush = useCallback(async () => {
    if (!metrics || hasTriggeredRef.current.has('weak_week')) return;
    if (!metrics.isWeakWeek || metrics.weeklyOccupancyRate >= 70) return;

    hasTriggeredRef.current.add('weak_week');
    
    await sendPush({
      title: "⚠️ Semana fraca na agenda",
      body: `Ocupação de apenas ${metrics.weeklyOccupancyRate}%. Growth pode ajudar a preencher sua agenda!`,
      data: { type: 'weak_week', action: '/planos' },
    });
  }, [metrics, sendPush]);

  // Auto-trigger para usuários Start (apenas uma vez por sessão)
  useEffect(() => {
    if (planLoading || !isStart || !metrics || !userId) return;

    // Escolher o trigger mais relevante baseado nas métricas
    const triggers = [
      { priority: metrics.weeklyLostRevenue, fn: triggerWeeklyLossPush },
      { priority: metrics.inactiveClientsCount * metrics.avgTicket, fn: triggerInactiveClientsPush },
      { priority: metrics.weeklyEmptySlots * metrics.avgTicket, fn: triggerEmptySlotsPush },
      { priority: metrics.isWeakWeek ? 100 : 0, fn: triggerWeakWeekPush },
    ].sort((a, b) => b.priority - a.priority);

    // Executar apenas o trigger mais relevante (se houver quota)
    if (triggers[0].priority > 0 && canSendPush()) {
      // Delay de 5 segundos para não ser intrusivo
      const timer = setTimeout(() => {
        triggers[0].fn();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [planLoading, isStart, metrics, userId, triggerWeeklyLossPush, triggerInactiveClientsPush, triggerEmptySlotsPush, triggerWeakWeekPush]);

  return {
    sendPush,
    triggerWeeklyLossPush,
    triggerInactiveClientsPush,
    triggerEmptySlotsPush,
    triggerWeakWeekPush,
    canSendPush: canSendPush(),
    remainingPushes: getRemainingPushes(),
  };
}