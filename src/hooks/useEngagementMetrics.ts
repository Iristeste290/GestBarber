/**
 * Hook para métricas de engajamento
 * P2 FIX: Agora usa hook unificado useBarbershopMetrics para evitar duplicação
 */

import { useBarbershopMetrics } from "./useBarbershopMetrics";

export interface EngagementMetrics {
  // Métricas da semana atual
  weeklyEmptySlots: number;
  weeklyOccupancyRate: number;
  weeklyNoShows: number;
  weeklyCancellations: number;
  weeklyLostRevenue: number;
  
  // Métricas de clientes
  reactivatedClientsThisMonth: number;
  inactiveClientsCount: number;
  
  // Métricas de recuperação (simulado para Growth)
  potentialRecoveryThisWeek: number;
  potentialMonthlyRecovery: number;
  
  // Progresso
  appointmentsThisMonth: number;
  revenueThisMonth: number;
  avgTicket: number;
  
  // Status da semana
  isWeakWeek: boolean;
  weekStrength: 'weak' | 'average' | 'strong';
}

export function useEngagementMetrics() {
  const { data, isLoading, error } = useBarbershopMetrics();

  // Mapear para formato legado de compatibilidade
  const mappedData: EngagementMetrics | undefined = data ? {
    weeklyEmptySlots: data.weeklyEmptySlots,
    weeklyOccupancyRate: data.weeklyOccupancyRate,
    weeklyNoShows: data.weeklyNoShows,
    weeklyCancellations: data.weeklyCancellations,
    weeklyLostRevenue: data.weeklyLostRevenue,
    reactivatedClientsThisMonth: data.reactivatedClientsThisMonth,
    inactiveClientsCount: data.inactiveClientsCount,
    potentialRecoveryThisWeek: data.potentialWeeklyRecovery,
    potentialMonthlyRecovery: data.potentialMonthlyRecovery,
    appointmentsThisMonth: data.appointmentsThisMonth,
    revenueThisMonth: data.revenueThisMonth,
    avgTicket: data.avgTicket,
    isWeakWeek: data.isWeakWeek,
    weekStrength: data.weekStrength,
  } : undefined;

  return {
    data: mappedData,
    isLoading,
    error,
  };
}
