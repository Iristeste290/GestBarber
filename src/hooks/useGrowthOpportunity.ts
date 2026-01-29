/**
 * Hook para oportunidade de crescimento
 * P2 FIX: Agora usa hook unificado useBarbershopMetrics para evitar duplicação
 */

import { useBarbershopMetrics } from "./useBarbershopMetrics";

// Re-export types para compatibilidade
export interface BarberMetrics {
  avgTicket: number;
  noShowsLast30Days: number;
  cancellationsLast30Days: number;
  emptySlotsLast30Days: number;
  inactiveClientsCount: number;
}

export interface GrowthOpportunity {
  missedRevenueFromNoShows: number;
  missedRevenueFromCancellations: number;
  missedRevenueFromEmptySlots: number;
  missedRevenueFromInactiveClients: number;
  totalMissedRevenue: number;
  potentialRecoveryWithGrowth: number;
}

interface UseGrowthOpportunityResult {
  metrics: BarberMetrics | null;
  opportunity: GrowthOpportunity | null;
  isLoading: boolean;
  error: Error | null;
}

export function useGrowthOpportunity(): UseGrowthOpportunityResult {
  const { data, isLoading, error } = useBarbershopMetrics();

  // Mapear para formato legado de compatibilidade
  const metrics: BarberMetrics | null = data ? {
    avgTicket: data.avgTicket,
    noShowsLast30Days: data.noShowsLast30Days,
    cancellationsLast30Days: data.cancellationsLast30Days,
    emptySlotsLast30Days: data.emptySlotsLast30Days,
    inactiveClientsCount: data.inactiveClientsCount,
  } : null;

  const opportunity: GrowthOpportunity | null = data ? {
    missedRevenueFromNoShows: data.missedRevenueFromNoShows,
    missedRevenueFromCancellations: data.missedRevenueFromCancellations,
    missedRevenueFromEmptySlots: data.missedRevenueFromEmptySlots,
    missedRevenueFromInactiveClients: data.missedRevenueFromInactiveClients,
    totalMissedRevenue: data.totalMissedRevenue,
    potentialRecoveryWithGrowth: data.potentialRecoveryWithGrowth,
  } : null;

  return {
    metrics,
    opportunity,
    isLoading,
    error: error as Error | null,
  };
}