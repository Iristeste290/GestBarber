/**
 * Hook unificado para métricas de barbearia
 * P2 FIX: Consolida lógica duplicada de useGrowthOpportunity e useEngagementMetrics
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfWeek, endOfWeek, format } from "date-fns";

// Taxas de recuperação estimadas (conservadoras)
export const RECOVERY_RATES = {
  noShows: 0.6,           // 60% redução com lembretes automáticos
  cancellations: 0.5,     // 50% redução com confirmações
  emptySlots: 0.4,        // 40% preenchimento com campanhas
  inactiveClients: 0.3,   // 30% reativação com automações
};

export interface BarbershopMetrics {
  // Ticket médio (base para cálculos)
  avgTicket: number;
  
  // Métricas dos últimos 30 dias
  noShowsLast30Days: number;
  cancellationsLast30Days: number;
  emptySlotsLast30Days: number;
  inactiveClientsCount: number;
  
  // Métricas da semana atual
  weeklyEmptySlots: number;
  weeklyAppointments: number;
  weeklyNoShows: number;
  weeklyCancellations: number;
  weeklyOccupancyRate: number;
  weeklyLostRevenue: number;
  
  // Métricas do mês
  appointmentsThisMonth: number;
  revenueThisMonth: number;
  reactivatedClientsThisMonth: number;
  
  // Status da semana
  isWeakWeek: boolean;
  weekStrength: 'weak' | 'average' | 'strong';
  
  // Valores calculados de oportunidade
  missedRevenueFromNoShows: number;
  missedRevenueFromCancellations: number;
  missedRevenueFromEmptySlots: number;
  missedRevenueFromInactiveClients: number;
  totalMissedRevenue: number;
  potentialRecoveryWithGrowth: number;
  potentialWeeklyRecovery: number;
  potentialMonthlyRecovery: number;
}

async function fetchBarbershopMetrics(userId: string): Promise<BarbershopMetrics> {
  const now = new Date();
  const thirtyDaysAgo = format(subDays(now, 30), 'yyyy-MM-dd');
  const ninetyDaysAgo = format(subDays(now, 90), 'yyyy-MM-dd');
  const today = format(now, 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');

  // Buscar todas as métricas em paralelo
  const [
    avgTicketResult,
    noShowsResult,
    cancellationsResult,
    emptySlotsResult,
    inactiveClientsResult,
    weeklyEmptySlotsResult,
    weeklyAppointmentsResult,
    weeklyNoShowsResult,
    weeklyCancellationsResult,
    monthlyAppointmentsResult,
    reactivatedResult,
  ] = await Promise.all([
    // 1. Ticket médio (últimos 90 dias)
    supabase
      .from('appointments')
      .select('service:services(price), barber:barbers!inner(user_id)')
      .eq('barber.user_id', userId)
      .eq('status', 'completed')
      .gte('appointment_date', ninetyDaysAgo)
      .limit(200),

    // 2. No-shows dos últimos 30 dias
    supabase
      .from('appointments')
      .select('id, barber:barbers!inner(user_id)', { count: 'exact' })
      .eq('barber.user_id', userId)
      .eq('status', 'no_show')
      .gte('appointment_date', thirtyDaysAgo)
      .lte('appointment_date', today),

    // 3. Cancelamentos dos últimos 30 dias
    supabase
      .from('appointments')
      .select('id, barber:barbers!inner(user_id)', { count: 'exact' })
      .eq('barber.user_id', userId)
      .eq('status', 'cancelled')
      .gte('appointment_date', thirtyDaysAgo)
      .lte('appointment_date', today),

    // 4. Horários vazios dos últimos 30 dias
    supabase
      .from('empty_slots')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'available')
      .gte('slot_date', thirtyDaysAgo)
      .lte('slot_date', today),

    // 5. Clientes inativos (30+ dias sem agendar)
    supabase
      .from('client_behavior')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .not('last_appointment_date', 'is', null)
      .lt('last_appointment_date', thirtyDaysAgo),

    // 6. Horários vazios da semana
    supabase
      .from('empty_slots')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'available')
      .gte('slot_date', weekStart)
      .lte('slot_date', weekEnd),

    // 7. Agendamentos da semana
    supabase
      .from('appointments')
      .select('id, barber:barbers!inner(user_id)', { count: 'exact' })
      .eq('barber.user_id', userId)
      .gte('appointment_date', weekStart)
      .lte('appointment_date', weekEnd)
      .in('status', ['scheduled', 'completed']),

    // 8. No-shows da semana
    supabase
      .from('appointments')
      .select('id, barber:barbers!inner(user_id)', { count: 'exact' })
      .eq('barber.user_id', userId)
      .eq('status', 'no_show')
      .gte('appointment_date', weekStart)
      .lte('appointment_date', weekEnd),

    // 9. Cancelamentos da semana
    supabase
      .from('appointments')
      .select('id, barber:barbers!inner(user_id)', { count: 'exact' })
      .eq('barber.user_id', userId)
      .eq('status', 'cancelled')
      .gte('appointment_date', weekStart)
      .lte('appointment_date', weekEnd),

    // 10. Agendamentos do mês (com receita)
    supabase
      .from('appointments')
      .select('id, service:services(price), barber:barbers!inner(user_id)', { count: 'exact' })
      .eq('barber.user_id', userId)
      .eq('status', 'completed')
      .gte('appointment_date', monthStart),

    // 11. Clientes reativados este mês
    supabase
      .from('client_behavior')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('last_appointment_date', monthStart)
      .gt('months_as_client', 1),
  ]);

  // Calcular ticket médio
  let avgTicket = 45; // Valor default
  if (avgTicketResult.data && avgTicketResult.data.length > 0) {
    const prices = avgTicketResult.data
      .map(a => Number((a.service as any)?.price) || 0)
      .filter(p => p > 0);
    if (prices.length > 0) {
      avgTicket = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    }
  }

  // Métricas básicas
  const noShowsLast30Days = noShowsResult.count || 0;
  const cancellationsLast30Days = cancellationsResult.count || 0;
  const emptySlotsLast30Days = emptySlotsResult.count || 0;
  const inactiveClientsCount = inactiveClientsResult.count || 0;
  
  const weeklyEmptySlots = weeklyEmptySlotsResult.count || 0;
  const weeklyAppointments = weeklyAppointmentsResult.count || 0;
  const weeklyNoShows = weeklyNoShowsResult.count || 0;
  const weeklyCancellations = weeklyCancellationsResult.count || 0;
  
  const appointmentsThisMonth = monthlyAppointmentsResult.count || 0;
  const reactivatedClientsThisMonth = reactivatedResult.count || 0;

  // Calcular ocupação semanal
  const totalWeeklySlots = weeklyEmptySlots + weeklyAppointments;
  const weeklyOccupancyRate = totalWeeklySlots > 0 
    ? Math.round((weeklyAppointments / totalWeeklySlots) * 100) 
    : 100;

  // Calcular perdas semanais
  const weeklyLostRevenue = (weeklyNoShows + weeklyCancellations) * avgTicket;

  // Calcular receita do mês
  const revenueThisMonth = monthlyAppointmentsResult.data
    ? monthlyAppointmentsResult.data.reduce((sum, a) => sum + (Number((a.service as any)?.price) || 0), 0)
    : 0;

  // Determinar força da semana
  const isWeakWeek = weeklyOccupancyRate < 70 || weeklyEmptySlots > 10;
  let weekStrength: 'weak' | 'average' | 'strong' = 'average';
  if (weeklyOccupancyRate < 50) weekStrength = 'weak';
  else if (weeklyOccupancyRate >= 80) weekStrength = 'strong';

  // Calcular valores de oportunidade perdida
  const missedRevenueFromNoShows = noShowsLast30Days * avgTicket;
  const missedRevenueFromCancellations = cancellationsLast30Days * avgTicket;
  const missedRevenueFromEmptySlots = emptySlotsLast30Days * avgTicket;
  const missedRevenueFromInactiveClients = inactiveClientsCount * avgTicket;

  const totalMissedRevenue = 
    missedRevenueFromNoShows + 
    missedRevenueFromCancellations + 
    missedRevenueFromEmptySlots + 
    missedRevenueFromInactiveClients;

  // Potencial de recuperação com Growth
  const potentialRecoveryWithGrowth = 
    (missedRevenueFromNoShows * RECOVERY_RATES.noShows) +
    (missedRevenueFromCancellations * RECOVERY_RATES.cancellations) +
    (missedRevenueFromEmptySlots * RECOVERY_RATES.emptySlots) +
    (missedRevenueFromInactiveClients * RECOVERY_RATES.inactiveClients);

  // Potenciais de recuperação semanal/mensal
  const potentialWeeklyRecovery = 
    (weeklyEmptySlots * avgTicket * RECOVERY_RATES.emptySlots) + 
    (weeklyLostRevenue * RECOVERY_RATES.noShows);
  const potentialMonthlyRecovery = potentialWeeklyRecovery * 4;

  return {
    avgTicket,
    noShowsLast30Days,
    cancellationsLast30Days,
    emptySlotsLast30Days,
    inactiveClientsCount,
    weeklyEmptySlots,
    weeklyAppointments,
    weeklyNoShows,
    weeklyCancellations,
    weeklyOccupancyRate,
    weeklyLostRevenue,
    appointmentsThisMonth,
    revenueThisMonth,
    reactivatedClientsThisMonth,
    isWeakWeek,
    weekStrength,
    missedRevenueFromNoShows,
    missedRevenueFromCancellations,
    missedRevenueFromEmptySlots,
    missedRevenueFromInactiveClients,
    totalMissedRevenue,
    potentialRecoveryWithGrowth,
    potentialWeeklyRecovery,
    potentialMonthlyRecovery,
  };
}

export function useBarbershopMetrics() {
  return useQuery({
    queryKey: ['barbershop-metrics'],
    queryFn: async (): Promise<BarbershopMetrics> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      return fetchBarbershopMetrics(user.id);
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
  });
}

/**
 * Helper para calcular recuperação potencial por categoria
 */
export function getRecoveryEstimate(category: keyof typeof RECOVERY_RATES, lostValue: number): number {
  return lostValue * RECOVERY_RATES[category];
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