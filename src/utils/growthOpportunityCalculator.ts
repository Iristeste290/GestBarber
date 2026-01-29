// Tipos para métricas do barbeiro
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

// Taxas de recuperação estimadas (conservadoras)
const RECOVERY_RATES = {
  noShows: 0.6,           // 60% redução com lembretes automáticos
  cancellations: 0.5,     // 50% redução com confirmações
  emptySlots: 0.4,        // 40% preenchimento com campanhas
  inactiveClients: 0.3,   // 30% reativação com automações
};

/**
 * Calcula a oportunidade de receita perdida e potencial de recuperação
 * com base nas métricas reais do barbeiro
 */
export function calculateGrowthOpportunity(metrics: BarberMetrics): GrowthOpportunity {
  const { avgTicket, noShowsLast30Days, cancellationsLast30Days, emptySlotsLast30Days, inactiveClientsCount } = metrics;

  // Valor perdido por categoria
  const missedRevenueFromNoShows = noShowsLast30Days * avgTicket;
  const missedRevenueFromCancellations = cancellationsLast30Days * avgTicket;
  const missedRevenueFromEmptySlots = emptySlotsLast30Days * avgTicket;
  const missedRevenueFromInactiveClients = inactiveClientsCount * avgTicket;

  // Total perdido
  const totalMissedRevenue = 
    missedRevenueFromNoShows + 
    missedRevenueFromCancellations + 
    missedRevenueFromEmptySlots + 
    missedRevenueFromInactiveClients;

  // Potencial de recuperação com Growth (aplicando taxas conservadoras)
  const potentialRecoveryWithGrowth = 
    (missedRevenueFromNoShows * RECOVERY_RATES.noShows) +
    (missedRevenueFromCancellations * RECOVERY_RATES.cancellations) +
    (missedRevenueFromEmptySlots * RECOVERY_RATES.emptySlots) +
    (missedRevenueFromInactiveClients * RECOVERY_RATES.inactiveClients);

  return {
    missedRevenueFromNoShows,
    missedRevenueFromCancellations,
    missedRevenueFromEmptySlots,
    missedRevenueFromInactiveClients,
    totalMissedRevenue,
    potentialRecoveryWithGrowth,
  };
}

/**
 * Formata valor em Real brasileiro
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Calcula recuperação potencial específica por categoria
 */
export function getRecoveryEstimate(category: keyof typeof RECOVERY_RATES, lostValue: number): number {
  return lostValue * RECOVERY_RATES[category];
}
