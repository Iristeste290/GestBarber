import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlanValidation } from "./usePlanValidation";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { logTriggerEvent } from "./useUpgradeTriggerAnalytics";

// Tipos de gatilhos - Fase 1, 2 e 3 GestBarber (Financeiros, Comportamentais e Comparativos)
export type TriggerType = 
  // 💰 FINANCEIROS
  | "TRIGGER_MONEY_LOST"           // Dinheiro perdido por faltas/não confirmações
  | "TRIGGER_REVENUE_POTENTIAL"    // Potencial de receita extra com Growth
  | "TRIGGER_REVENUE_STAGNANT"     // Receita estagnada vs mês anterior
  | "TRIGGER_COMMISSION_LOST"      // Comissão perdida pelo barbeiro
  // 📊 COMPORTAMENTAIS
  | "TRIGGER_EMPTY_SLOTS"          // Agenda subutilizada (horários ociosos)
  | "TRIGGER_RECURRING_EMPTY"      // Mesmos horários vazios toda semana
  | "TRIGGER_ABANDONED_BOOKING"    // Tentativas de agendamento não concluídas
  | "TRIGGER_MANUAL_TIME"          // Tempo desperdiçado com processos manuais
  | "TRIGGER_LOST_CLIENTS"         // Clientes perdidos (30+ dias)
  | "TRIGGER_VIP_CLIENT_LOST"      // Cliente VIP (alto ticket) parou de vir
  | "TRIGGER_WAIT_TIME"            // Tempo de espera alto
  // 📈 COMPARATIVOS
  | "TRIGGER_BENCHMARK_NOSHOW"     // Taxa de no-show 2x maior que a média
  | "TRIGGER_BENCHMARK_OCCUPANCY"  // Ocupação abaixo da média do setor
  | "TRIGGER_NO_NEW_SERVICES"      // Não adiciona serviços há 3+ meses
  | "TRIGGER_COMPETITOR_GROWTH"    // Concorrentes crescendo mais
  // ⚡ URGÊNCIA/SAZONAIS
  | "TRIGGER_HIGH_DEMAND"          // Agenda cheia - aumentar ticket
  | "TRIGGER_SEASONAL"             // Datas comemorativas (Black Friday, etc)
  | "TRIGGER_CAPACITY_FULL"        // Recusando clientes por falta de organização
  // 🏆 OUTROS
  | "TRIGGER_RICH_AREA"            // Bairro rico
  | "TRIGGER_REVENUE_GROWTH"       // Crescimento de receita
  | "TRIGGER_FEATURE_BLOCK";       // Bloqueio de feature

export interface UpgradeTrigger {
  type: TriggerType;
  message: string;
  lostMoney?: number;
  lostClients?: number;
  featureName?: string;
  abandonedBookings?: number;
  manualTimeMinutes?: number;
  noShowCount?: number;
  potentialRevenue?: number;
  potentialRevenueMonthly?: number;
  potentialRevenueYearly?: number;
  // Novas propriedades
  benchmarkComparison?: number;     // % acima/abaixo do benchmark
  commissionLost?: number;          // Comissão perdida em R$
  vipClientName?: string;           // Nome do cliente VIP
  seasonalEvent?: string;           // Nome do evento sazonal
  priority: number; // 1 = highest
}

export interface GrowthMetrics {
  avgTicket: number;
  monthlyRevenue: number;
  previousMonthRevenue: number;     // Receita mês anterior
  dailySlotsTotal: number;
  dailySlotsFilled: number;
  lostClients30d: number;
  neighborhoodIncomeLevel: "low" | "medium" | "high";
  barberCount: number;
  featureAccessAttempts: string[];
  // Métricas Fase 1
  noShowLast30d: number;
  cancelledLast30d: number;
  notConfirmedLast30d: number;
  abandonedBookings7d: number;
  manualTimeMinutes7d: number;
  emptySlots7dAvg: number;
  // Novas métricas Fase 2 e 3
  lastServiceAddedDays: number;     // Dias desde último serviço adicionado
  vipClientsLost: VipClientLost[];  // Clientes VIP perdidos
  recurringEmptySlots: string[];    // Horários vazios recorrentes
  refusedAppointments7d: number;    // Agendamentos recusados por lotação
  // Benchmarks do setor
  sectorNoShowRate: number;
  sectorOccupancyRate: number;
  userNoShowRate: number;
  userOccupancyRate: number;
}

interface VipClientLost {
  name: string;
  phone: string;
  avgTicket: number;
  daysSinceLastVisit: number;
}

interface ScheduledTrigger {
  trigger_type: TriggerType;
  trigger_name: string;
  trigger_message: string;
  priority: number;
}

const TRIGGER_STORAGE_KEY = "gestbarber_last_trigger";
const TRIGGER_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 horas entre triggers do mesmo tipo

export const useGrowthTriggerEngine = () => {
  const { isGrowth, isStart, loading: planLoading } = usePlanValidation();
  const [activeTrigger, setActiveTrigger] = useState<UpgradeTrigger | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggeredRef = useRef(false);

  // 📊 Buscar métricas da barbearia (expandido para Fase 1, 2 e 3)
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ["growth-trigger-metrics"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const today = format(new Date(), "yyyy-MM-dd");
      const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const ninetyDaysAgo = format(subDays(new Date(), 90), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
      const prevMonthStart = format(startOfMonth(subDays(startOfMonth(new Date()), 1)), "yyyy-MM-dd");
      const prevMonthEnd = format(endOfMonth(subDays(startOfMonth(new Date()), 1)), "yyyy-MM-dd");

      // Parallel queries for performance
      const [
        barbersResult,
        servicesResult,
        appointmentsToday,
        completedAppointments,
        prevMonthAppointments,
        lostClientsResult,
        neighborhoodResult,
        noShowAppointments,
        cancelledAppointments,
        notConfirmedAppointments,
        abandonedBookingsResult,
        manualProcessResult,
        weeklyAppointments,
        // Novas queries Fase 2 e 3
        vipClientsQuery,
        sectorBenchmarks,
        lastServiceQuery,
        scheduledTriggersQuery,
      ] = await Promise.all([
        // Barbers count
        supabase
          .from("barbers")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("is_active", true),
        
        // Average ticket from services
        supabase
          .from("services")
          .select("price, created_at")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        
        // Today's appointments (slots used)
        supabase
          .from("appointments")
          .select("id, status, barber_id")
          .eq("appointment_date", today)
          .in("status", ["scheduled", "confirmed", "completed", "pending"]),
        
        // Monthly completed appointments for revenue
        supabase
          .from("appointments")
          .select("service_id, services(price)")
          .eq("status", "completed")
          .gte("appointment_date", monthStart)
          .lte("appointment_date", monthEnd),
        
        // Previous month completed appointments for comparison
        supabase
          .from("appointments")
          .select("service_id, services(price)")
          .eq("status", "completed")
          .gte("appointment_date", prevMonthStart)
          .lte("appointment_date", prevMonthEnd),
        
        // Lost clients (inactive 30+ days)
        supabase
          .from("reactivation_queue")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("status", "pending"),
        
        // Neighborhood data
        supabase
          .from("neighborhood_stats")
          .select("total_revenue, clients_count")
          .eq("user_id", user.id)
          .order("total_revenue", { ascending: false })
          .limit(1),

        // 💰 No-shows nos últimos 30 dias
        supabase
          .from("appointments")
          .select("id", { count: "exact" })
          .eq("status", "no_show")
          .gte("appointment_date", thirtyDaysAgo),
        
        // 💰 Cancelamentos nos últimos 30 dias
        supabase
          .from("appointments")
          .select("id", { count: "exact" })
          .eq("status", "cancelled")
          .gte("appointment_date", thirtyDaysAgo),
        
        // 💰 Não confirmados nos últimos 30 dias
        supabase
          .from("appointments")
          .select("id", { count: "exact" })
          .eq("status", "pending")
          .lte("appointment_date", today),
        
        // ❌ Agendamentos abandonados últimos 7 dias
        supabase
          .from("booking_attempts")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .not("abandoned_at", "is", null)
          .gte("created_at", sevenDaysAgo),
        
        // ⏱️ Tempo gasto em processos manuais últimos 7 dias
        supabase
          .from("manual_process_logs")
          .select("duration_seconds")
          .eq("user_id", user.id)
          .gte("created_at", sevenDaysAgo),
        
        // 📆 Agendamentos da última semana (para calcular média de slots vazios)
        supabase
          .from("appointments")
          .select("id, appointment_date, appointment_time")
          .gte("appointment_date", sevenDaysAgo)
          .lte("appointment_date", today)
          .in("status", ["scheduled", "confirmed", "completed"]),
        
        // 👑 Clientes VIP perdidos (alto ticket médio, >60 dias sem vir)
        supabase
          .from("client_behavior")
          .select("client_name, client_phone, last_appointment_date")
          .eq("user_id", user.id)
          .eq("customer_status", "inactive")
          .gte("customer_score", 80) // Score alto = VIP
          .order("last_appointment_date", { ascending: true })
          .limit(5),
        
        // 📈 Benchmarks do setor
        supabase
          .from("sector_benchmarks")
          .select("metric_name, avg_value, p50_value")
          .in("metric_name", ["no_show_rate", "occupancy_rate"]),
        
        // 🆕 Último serviço adicionado
        supabase
          .from("services")
          .select("created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),
        
        // 📅 Gatilhos sazonais agendados
        supabase
          .from("scheduled_triggers")
          .select("trigger_type, trigger_name, trigger_message, priority")
          .eq("is_active", true)
          .lte("start_date", today)
          .gte("end_date", today)
          .contains("target_plans", ["start"]),
      ]);

      // Calculate avg ticket
      const prices = servicesResult.data?.map(s => Number(s.price)) || [];
      const avgTicket = prices.length > 0 
        ? prices.reduce((a, b) => a + b, 0) / prices.length 
        : 50;

      // Calculate monthly revenue
      const monthlyRevenue = completedAppointments.data?.reduce((sum, apt) => {
        const price = (apt.services as any)?.price || 0;
        return sum + Number(price);
      }, 0) || 0;

      // Calculate previous month revenue
      const previousMonthRevenue = prevMonthAppointments.data?.reduce((sum, apt) => {
        const price = (apt.services as any)?.price || 0;
        return sum + Number(price);
      }, 0) || 0;

      // Calculate slots (assuming 8 hour day, 30 min slots per barber)
      const barberCount = barbersResult.count || 1;
      const slotsPerBarber = 16; // 8 hours / 30 min
      const dailySlotsTotal = barberCount * slotsPerBarber;
      const dailySlotsFilled = appointmentsToday.data?.length || 0;

      // Lost clients
      const lostClients30d = lostClientsResult.count || 0;

      // Determine income level based on avg revenue per client
      const topNeighborhood = neighborhoodResult.data?.[0];
      let neighborhoodIncomeLevel: "low" | "medium" | "high" = "medium";
      if (topNeighborhood) {
        const avgRevenuePerClient = 
          (topNeighborhood.total_revenue || 0) / (topNeighborhood.clients_count || 1);
        if (avgRevenuePerClient > 150) {
          neighborhoodIncomeLevel = "high";
        } else if (avgRevenuePerClient < 50) {
          neighborhoodIncomeLevel = "low";
        }
      }

      // Novas métricas Fase 1
      const noShowLast30d = noShowAppointments.count || 0;
      const cancelledLast30d = cancelledAppointments.count || 0;
      const notConfirmedLast30d = notConfirmedAppointments.count || 0;
      const abandonedBookings7d = abandonedBookingsResult.count || 0;
      
      // Calcular tempo manual em minutos
      const totalManualSeconds = manualProcessResult.data?.reduce(
        (sum, log) => sum + (log.duration_seconds || 0), 0
      ) || 0;
      const manualTimeMinutes7d = Math.round(totalManualSeconds / 60);

      // Calcular média de slots vazios na semana
      const weeklySlotsByDay: Record<string, number> = {};
      weeklyAppointments.data?.forEach(apt => {
        const date = apt.appointment_date as string;
        weeklySlotsByDay[date] = (weeklySlotsByDay[date] || 0) + 1;
      });
      const daysWithData = Object.keys(weeklySlotsByDay).length || 1;
      const avgSlotsFilledPerDay = Object.values(weeklySlotsByDay).reduce((a, b) => a + b, 0) / daysWithData;
      const emptySlots7dAvg = Math.max(0, dailySlotsTotal - avgSlotsFilledPerDay);

      // 👑 Clientes VIP perdidos
      const vipClientsLost: VipClientLost[] = (vipClientsQuery.data || []).map(c => {
        const lastVisit = c.last_appointment_date ? new Date(c.last_appointment_date) : new Date();
        const daysSince = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
        return {
          name: c.client_name || "Cliente VIP",
          phone: c.client_phone || "",
          avgTicket: avgTicket * 1.5, // VIPs pagam mais
          daysSinceLastVisit: daysSince,
        };
      }).filter(c => c.daysSinceLastVisit > 60);

      // 📈 Benchmarks do setor
      const benchmarks = sectorBenchmarks.data || [];
      const noShowBenchmark = benchmarks.find(b => b.metric_name === "no_show_rate");
      const occupancyBenchmark = benchmarks.find(b => b.metric_name === "occupancy_rate");
      
      const sectorNoShowRate = noShowBenchmark?.avg_value || 12.5;
      const sectorOccupancyRate = occupancyBenchmark?.avg_value || 65;

      // Calcular taxas do usuário
      const totalAppointments30d = noShowLast30d + cancelledLast30d + (completedAppointments.data?.length || 0);
      const userNoShowRate = totalAppointments30d > 0 
        ? (noShowLast30d / totalAppointments30d) * 100 
        : 0;
      const userOccupancyRate = dailySlotsTotal > 0 
        ? (dailySlotsFilled / dailySlotsTotal) * 100 
        : 0;

      // 🆕 Dias desde último serviço adicionado
      const lastServiceDate = lastServiceQuery.data?.[0]?.created_at;
      const lastServiceAddedDays = lastServiceDate 
        ? Math.floor((Date.now() - new Date(lastServiceDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Detectar horários recorrentemente vazios
      const slotCounts: Record<string, number> = {};
      weeklyAppointments.data?.forEach(apt => {
        const time = apt.appointment_time;
        slotCounts[time] = (slotCounts[time] || 0) + 1;
      });
      const recurringEmptySlots = Object.entries(slotCounts)
        .filter(([_, count]) => count <= 1) // Aparecem ≤1 vez na semana
        .map(([time]) => time);

      return {
        avgTicket,
        monthlyRevenue,
        previousMonthRevenue,
        dailySlotsTotal,
        dailySlotsFilled,
        lostClients30d,
        neighborhoodIncomeLevel,
        barberCount,
        featureAccessAttempts: [],
        // Métricas Fase 1
        noShowLast30d,
        cancelledLast30d,
        notConfirmedLast30d,
        abandonedBookings7d,
        manualTimeMinutes7d,
        emptySlots7dAvg,
        // Métricas Fase 2 e 3
        lastServiceAddedDays,
        vipClientsLost,
        recurringEmptySlots,
        refusedAppointments7d: 0, // TODO: implementar tracking de recusas
        sectorNoShowRate,
        sectorOccupancyRate,
        userNoShowRate,
        userOccupancyRate,
        // Gatilhos sazonais
        scheduledTriggers: scheduledTriggersQuery.data || [],
      } as GrowthMetrics & { scheduledTriggers: ScheduledTrigger[] };
    },
    enabled: !planLoading && isStart,
    staleTime: 5 * 60 * 1000, // 5 min
  });

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

  // 🎯 Avaliar gatilhos - FASE 1 GESTBARBER
  const evaluateTriggers = useCallback((): UpgradeTrigger | null => {
    if (!metrics || !isStart || planLoading) return null;

    const triggers: UpgradeTrigger[] = [];

    // 1️⃣ 💰 TRIGGER_MONEY_LOST - Dinheiro perdido por faltas e não confirmações
    const totalLostAppointments = metrics.noShowLast30d + metrics.cancelledLast30d + metrics.notConfirmedLast30d;
    if (totalLostAppointments >= 3) {
      const lostMoney = Math.round(totalLostAppointments * metrics.avgTicket);
      if (lostMoney >= 100 && canShowTrigger("TRIGGER_MONEY_LOST")) {
        triggers.push({
          type: "TRIGGER_MONEY_LOST",
          message: `Você perdeu R$ ${lostMoney} em ${totalLostAppointments} agendamentos que falharam (faltas, cancelamentos e não confirmados). O Growth prevê e evita isso automaticamente.`,
          lostMoney,
          noShowCount: totalLostAppointments,
          priority: 1, // Prioridade máxima - dinheiro perdido é o mais impactante
        });
      }
    }

    // 2️⃣ 📆 TRIGGER_EMPTY_SLOTS - Agenda subutilizada (horários ociosos)
    const emptySlots = metrics.dailySlotsTotal - metrics.dailySlotsFilled;
    const emptyPercentage = (emptySlots / metrics.dailySlotsTotal) * 100;
    if (emptyPercentage >= 30) { // 30% ou mais de ociosidade
      const dailyLostMoney = Math.round(emptySlots * metrics.avgTicket);
      const weeklyLostMoney = Math.round(metrics.emptySlots7dAvg * metrics.avgTicket * 6); // 6 dias úteis
      if (canShowTrigger("TRIGGER_EMPTY_SLOTS")) {
        triggers.push({
          type: "TRIGGER_EMPTY_SLOTS",
          message: `Sua agenda tem ${Math.round(emptyPercentage)}% de ociosidade. São ${emptySlots} horários vazios só hoje (~ R$ ${dailyLostMoney}). O Growth preenche esses horários automaticamente.`,
          lostMoney: weeklyLostMoney,
          priority: 2,
        });
      }
    }

    // 3️⃣ ❌ TRIGGER_ABANDONED_BOOKING - Tentativas de agendamento não concluídas
    if (metrics.abandonedBookings7d >= 3 && canShowTrigger("TRIGGER_ABANDONED_BOOKING")) {
      const potentialLostMoney = Math.round(metrics.abandonedBookings7d * metrics.avgTicket);
      triggers.push({
        type: "TRIGGER_ABANDONED_BOOKING",
        message: `${metrics.abandonedBookings7d} clientes começaram a agendar mas desistiram nos últimos 7 dias. Isso representa ~ R$ ${potentialLostMoney} perdidos. O Growth recupera esses clientes automaticamente.`,
        abandonedBookings: metrics.abandonedBookings7d,
        lostMoney: potentialLostMoney,
        priority: 3,
      });
    }

    // 4️⃣ ⏱️ TRIGGER_MANUAL_TIME - Tempo desperdiçado com processos manuais
    if (metrics.manualTimeMinutes7d >= 60 && canShowTrigger("TRIGGER_MANUAL_TIME")) { // 1+ hora por semana
      const hoursWasted = Math.round(metrics.manualTimeMinutes7d / 60 * 10) / 10;
      const monthlyHours = Math.round(hoursWasted * 4);
      triggers.push({
        type: "TRIGGER_MANUAL_TIME",
        message: `Você gastou ${hoursWasted}h em processos manuais esta semana (~ ${monthlyHours}h/mês). O Growth automatiza agendamentos, lembretes e cobranças.`,
        manualTimeMinutes: metrics.manualTimeMinutes7d,
        priority: 4,
      });
    }

    // 5️⃣ 👥 TRIGGER_LOST_CLIENTS - Clientes perdidos (30+ dias sem voltar)
    // Prioridade alta porque clientes perdidos = receita recorrente perdida
    if (metrics.lostClients30d >= 3 && canShowTrigger("TRIGGER_LOST_CLIENTS")) {
      // Cada cliente perdido = ~2 visitas/mês x ticket médio
      const monthlyLostRevenue = Math.round(metrics.lostClients30d * metrics.avgTicket * 2);
      const yearlyLostRevenue = monthlyLostRevenue * 12;
      triggers.push({
        type: "TRIGGER_LOST_CLIENTS",
        message: `👥 ${metrics.lostClients30d} clientes sumiram há 30+ dias. São R$ ${monthlyLostRevenue}/mês (R$ ${yearlyLostRevenue}/ano) que você pode recuperar. O Growth envia mensagens de reativação automáticas.`,
        lostMoney: monthlyLostRevenue,
        lostClients: metrics.lostClients30d,
        priority: 2, // Alta prioridade - perda de receita recorrente
      });
    }

    // 6️⃣ 💵 TRIGGER_REVENUE_POTENTIAL - Potencial de receita extra com Growth
    // Calcula quanto o usuário poderia ganhar a mais usando os recursos Growth
    if (canShowTrigger("TRIGGER_REVENUE_POTENTIAL")) {
      // Componentes do potencial:
      // 1. Recuperar no-shows e cancelamentos (70% recuperável)
      const recoverableAppointments = Math.round((metrics.noShowLast30d + metrics.cancelledLast30d) * 0.7);
      const recoveredRevenue = recoverableAppointments * metrics.avgTicket;
      
      // 2. Preencher slots vazios (50% dos vazios)
      const fillableSlots = Math.round(metrics.emptySlots7dAvg * 0.5);
      const filledSlotsRevenue = fillableSlots * metrics.avgTicket * 26; // 26 dias úteis/mês
      
      // 3. Reativar clientes perdidos (30% voltam)
      const reactivatedClients = Math.round(metrics.lostClients30d * 0.3);
      const reactivatedRevenue = reactivatedClients * metrics.avgTicket * 2; // 2 visitas/mês
      
      // 4. Economia de tempo manual (tempo = dinheiro)
      const hoursPerMonth = (metrics.manualTimeMinutes7d / 60) * 4;
      const hourValue = 30; // R$ 30/hora estimado
      const timeValueRecovered = Math.round(hoursPerMonth * hourValue);
      
      // Total mensal
      const monthlyPotential = Math.round(recoveredRevenue + (filledSlotsRevenue / 12) + reactivatedRevenue + timeValueRecovered);
      const yearlyPotential = monthlyPotential * 12;
      
      // Só mostrar se potencial for significativo (> R$ 300/mês)
      if (monthlyPotential >= 300) {
        const percentGain = Math.round((monthlyPotential / Math.max(metrics.monthlyRevenue, 1)) * 100);
        triggers.push({
          type: "TRIGGER_REVENUE_POTENTIAL",
          message: `📈 Com o Growth você poderia ganhar +R$ ${monthlyPotential}/mês (${percentGain}% a mais). Isso inclui recuperar faltas, preencher agenda e reativar clientes automaticamente.`,
          potentialRevenue: monthlyPotential,
          potentialRevenueMonthly: monthlyPotential,
          potentialRevenueYearly: yearlyPotential,
          priority: 3, // Prioridade alta - mostra ganho potencial
        });
      }
    }

    // 7️⃣ 💰 TRIGGER_REVENUE_STAGNANT - Receita estagnada vs mês anterior
    if (metrics.previousMonthRevenue > 0 && canShowTrigger("TRIGGER_REVENUE_STAGNANT")) {
      const revenueChange = ((metrics.monthlyRevenue - metrics.previousMonthRevenue) / metrics.previousMonthRevenue) * 100;
      if (revenueChange <= 0) {
        triggers.push({
          type: "TRIGGER_REVENUE_STAGNANT",
          message: `Sua receita ${revenueChange < 0 ? 'caiu' : 'estagnou'} vs mês passado (${revenueChange.toFixed(0)}%). O Growth ajuda a recuperar crescimento com automações.`,
          lostMoney: Math.abs(metrics.monthlyRevenue - metrics.previousMonthRevenue),
          priority: 2,
        });
      }
    }

    // 8️⃣ 👑 TRIGGER_VIP_CLIENT_LOST - Cliente VIP sumiu
    if (metrics.vipClientsLost && metrics.vipClientsLost.length > 0 && canShowTrigger("TRIGGER_VIP_CLIENT_LOST")) {
      const vip = metrics.vipClientsLost[0];
      const yearlyLoss = Math.round(vip.avgTicket * 24); // 2x/mês * 12 meses
      triggers.push({
        type: "TRIGGER_VIP_CLIENT_LOST",
        message: `${vip.name} (cliente VIP) não volta há ${vip.daysSinceLastVisit} dias. Perda potencial: R$ ${yearlyLoss}/ano. O Growth reativa clientes automaticamente.`,
        lostMoney: yearlyLoss,
        vipClientName: vip.name,
        priority: 2,
      });
    }

    // 9️⃣ 📈 TRIGGER_BENCHMARK_NOSHOW - Taxa de no-show acima da média
    if (metrics.userNoShowRate > metrics.sectorNoShowRate * 1.5 && canShowTrigger("TRIGGER_BENCHMARK_NOSHOW")) {
      const comparison = Math.round((metrics.userNoShowRate / metrics.sectorNoShowRate - 1) * 100);
      triggers.push({
        type: "TRIGGER_BENCHMARK_NOSHOW",
        message: `Sua taxa de faltas (${metrics.userNoShowRate.toFixed(0)}%) é ${comparison}% maior que a média do setor. O Growth prevê e reduz no-shows automaticamente.`,
        benchmarkComparison: comparison,
        priority: 2,
      });
    }

    // 🔟 📈 TRIGGER_BENCHMARK_OCCUPANCY - Ocupação abaixo da média
    if (metrics.userOccupancyRate < metrics.sectorOccupancyRate * 0.8 && canShowTrigger("TRIGGER_BENCHMARK_OCCUPANCY")) {
      const gap = Math.round(metrics.sectorOccupancyRate - metrics.userOccupancyRate);
      triggers.push({
        type: "TRIGGER_BENCHMARK_OCCUPANCY",
        message: `Sua ocupação (${metrics.userOccupancyRate.toFixed(0)}%) está ${gap}% abaixo da média do setor. O Growth preenche horários automaticamente.`,
        benchmarkComparison: -gap,
        priority: 3,
      });
    }

    // 1️⃣1️⃣ 🆕 TRIGGER_NO_NEW_SERVICES - Não adiciona serviços há muito tempo
    if (metrics.lastServiceAddedDays > 90 && canShowTrigger("TRIGGER_NO_NEW_SERVICES")) {
      triggers.push({
        type: "TRIGGER_NO_NEW_SERVICES",
        message: `Você não adiciona novos serviços há ${Math.round(metrics.lastServiceAddedDays / 30)} meses. Inovar aumenta ticket médio. O Growth sugere serviços baseado em tendências.`,
        priority: 6,
      });
    }

    // 1️⃣2️⃣ 📅 TRIGGER_SEASONAL - Gatilhos sazonais (datas comemorativas)
    const extendedMetrics = metrics as GrowthMetrics & { scheduledTriggers?: ScheduledTrigger[] };
    if (extendedMetrics.scheduledTriggers && extendedMetrics.scheduledTriggers.length > 0) {
      const seasonal = extendedMetrics.scheduledTriggers[0];
      if (canShowTrigger("TRIGGER_SEASONAL")) {
        triggers.push({
          type: "TRIGGER_SEASONAL",
          message: seasonal.trigger_message,
          seasonalEvent: seasonal.trigger_name,
          priority: seasonal.priority,
        });
      }
    }

    // 1️⃣3️⃣ TRIGGER_HIGH_DEMAND - Agenda cheia
    if (metrics.dailySlotsFilled >= metrics.dailySlotsTotal * 0.9 && canShowTrigger("TRIGGER_HIGH_DEMAND")) {
      triggers.push({
        type: "TRIGGER_HIGH_DEMAND",
        message: "Sua agenda está 90%+ cheia! Hora de aumentar o ticket médio. O Growth sugere preços dinâmicos automaticamente.",
        priority: 7,
      });
    }

    // 1️⃣4️⃣ TRIGGER_RICH_AREA - Bairro de alto valor
    if (metrics.neighborhoodIncomeLevel === "high" && canShowTrigger("TRIGGER_RICH_AREA")) {
      triggers.push({
        type: "TRIGGER_RICH_AREA",
        message: "Você atende clientes de bairros de alto valor. O Growth ativa campanhas premium para atrair mais desse público.",
        priority: 8,
      });
    }

    // 1️⃣5️⃣ TRIGGER_REVENUE_GROWTH - Crescimento financeiro
    if (metrics.monthlyRevenue >= 5000 && canShowTrigger("TRIGGER_REVENUE_GROWTH")) {
      triggers.push({
        type: "TRIGGER_REVENUE_GROWTH",
        message: `Sua barbearia já fatura R$ ${metrics.monthlyRevenue.toLocaleString('pt-BR')}/mês. Hora de usar ferramentas profissionais para escalar.`,
        priority: 9,
      });
    }

    // Retornar o trigger de maior prioridade (menor número)
    if (triggers.length === 0) return null;
    return triggers.sort((a, b) => a.priority - b.priority)[0];
  }, [metrics, isStart, planLoading, canShowTrigger]);

  // 9️⃣ TRIGGER_FEATURE_BLOCK - Tentativa de acessar função premium
  const triggerFeatureBlock = useCallback(async (featureName: string) => {
    if (!isStart || isGrowth) return;

    const trigger: UpgradeTrigger = {
      type: "TRIGGER_FEATURE_BLOCK",
      message: `"${featureName}" é uma ferramenta do plano Growth que pode aumentar seu faturamento. Desbloqueie e pare de perder dinheiro.`,
      featureName,
      priority: 0, // Highest priority
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

  // 🔄 Rodar avaliação de triggers
  useEffect(() => {
    if (planLoading || !isStart || triggeredRef.current) return;
    
    const trigger = evaluateTriggers();
    if (trigger) {
      // Delay de 3s para não aparecer imediatamente ao carregar
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
