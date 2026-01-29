/**
 * Hook para avaliar e selecionar triggers
 */
import { useCallback } from "react";
import { GrowthMetrics, UpgradeTrigger, TriggerType } from "./types";
import { useTriggerCooldown } from "./useTriggerCooldown";

export const useTriggerEvaluator = (
  metrics: GrowthMetrics | null | undefined,
  isStart: boolean,
  planLoading: boolean
) => {
  const { canShowTrigger, recordTriggerShown } = useTriggerCooldown();

  const evaluateTriggers = useCallback((): UpgradeTrigger | null => {
    if (!metrics || !isStart || planLoading) return null;

    const triggers: UpgradeTrigger[] = [];

    // 1️⃣ TRIGGER_MONEY_LOST
    const totalLostAppointments = metrics.noShowLast30d + metrics.cancelledLast30d + metrics.notConfirmedLast30d;
    if (totalLostAppointments >= 3) {
      const lostMoney = Math.round(totalLostAppointments * metrics.avgTicket);
      if (lostMoney >= 100 && canShowTrigger("TRIGGER_MONEY_LOST")) {
        triggers.push({
          type: "TRIGGER_MONEY_LOST",
          message: `Você perdeu R$ ${lostMoney} em ${totalLostAppointments} agendamentos que falharam (faltas, cancelamentos e não confirmados). O Growth prevê e evita isso automaticamente.`,
          lostMoney,
          noShowCount: totalLostAppointments,
          priority: 1,
        });
      }
    }

    // 2️⃣ TRIGGER_EMPTY_SLOTS
    const emptySlots = metrics.dailySlotsTotal - metrics.dailySlotsFilled;
    const emptyPercentage = (emptySlots / metrics.dailySlotsTotal) * 100;
    if (emptyPercentage >= 30) {
      const dailyLostMoney = Math.round(emptySlots * metrics.avgTicket);
      const weeklyLostMoney = Math.round(metrics.emptySlots7dAvg * metrics.avgTicket * 6);
      if (canShowTrigger("TRIGGER_EMPTY_SLOTS")) {
        triggers.push({
          type: "TRIGGER_EMPTY_SLOTS",
          message: `Sua agenda tem ${Math.round(emptyPercentage)}% de ociosidade. São ${emptySlots} horários vazios só hoje (~ R$ ${dailyLostMoney}). O Growth preenche esses horários automaticamente.`,
          lostMoney: weeklyLostMoney,
          priority: 2,
        });
      }
    }

    // 3️⃣ TRIGGER_ABANDONED_BOOKING
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

    // 4️⃣ TRIGGER_MANUAL_TIME
    if (metrics.manualTimeMinutes7d >= 60 && canShowTrigger("TRIGGER_MANUAL_TIME")) {
      const hoursWasted = Math.round(metrics.manualTimeMinutes7d / 60 * 10) / 10;
      const monthlyHours = Math.round(hoursWasted * 4);
      triggers.push({
        type: "TRIGGER_MANUAL_TIME",
        message: `Você gastou ${hoursWasted}h em processos manuais esta semana (~ ${monthlyHours}h/mês). O Growth automatiza agendamentos, lembretes e cobranças.`,
        manualTimeMinutes: metrics.manualTimeMinutes7d,
        priority: 4,
      });
    }

    // 5️⃣ TRIGGER_LOST_CLIENTS
    if (metrics.lostClients30d >= 3 && canShowTrigger("TRIGGER_LOST_CLIENTS")) {
      const monthlyLostRevenue = Math.round(metrics.lostClients30d * metrics.avgTicket * 2);
      const yearlyLostRevenue = monthlyLostRevenue * 12;
      triggers.push({
        type: "TRIGGER_LOST_CLIENTS",
        message: `👥 ${metrics.lostClients30d} clientes sumiram há 30+ dias. São R$ ${monthlyLostRevenue}/mês (R$ ${yearlyLostRevenue}/ano) que você pode recuperar. O Growth envia mensagens de reativação automáticas.`,
        lostMoney: monthlyLostRevenue,
        lostClients: metrics.lostClients30d,
        priority: 2,
      });
    }

    // 6️⃣ TRIGGER_REVENUE_POTENTIAL
    if (canShowTrigger("TRIGGER_REVENUE_POTENTIAL")) {
      const recoverableAppointments = Math.round((metrics.noShowLast30d + metrics.cancelledLast30d) * 0.7);
      const recoveredRevenue = recoverableAppointments * metrics.avgTicket;
      const fillableSlots = Math.round(metrics.emptySlots7dAvg * 0.5);
      const filledSlotsRevenue = fillableSlots * metrics.avgTicket * 26;
      const reactivatedClients = Math.round(metrics.lostClients30d * 0.3);
      const reactivatedRevenue = reactivatedClients * metrics.avgTicket * 2;
      const hoursPerMonth = (metrics.manualTimeMinutes7d / 60) * 4;
      const timeValueRecovered = Math.round(hoursPerMonth * 30);
      
      const monthlyPotential = Math.round(recoveredRevenue + (filledSlotsRevenue / 12) + reactivatedRevenue + timeValueRecovered);
      const yearlyPotential = monthlyPotential * 12;
      
      if (monthlyPotential >= 300) {
        const percentGain = Math.round((monthlyPotential / Math.max(metrics.monthlyRevenue, 1)) * 100);
        triggers.push({
          type: "TRIGGER_REVENUE_POTENTIAL",
          message: `📈 Com o Growth você poderia ganhar +R$ ${monthlyPotential}/mês (${percentGain}% a mais). Isso inclui recuperar faltas, preencher agenda e reativar clientes automaticamente.`,
          potentialRevenue: monthlyPotential,
          potentialRevenueMonthly: monthlyPotential,
          potentialRevenueYearly: yearlyPotential,
          priority: 3,
        });
      }
    }

    // 7️⃣ TRIGGER_REVENUE_STAGNANT
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

    // 8️⃣ TRIGGER_VIP_CLIENT_LOST
    if (metrics.vipClientsLost?.length > 0 && canShowTrigger("TRIGGER_VIP_CLIENT_LOST")) {
      const vip = metrics.vipClientsLost[0];
      const yearlyLoss = Math.round(vip.avgTicket * 24);
      triggers.push({
        type: "TRIGGER_VIP_CLIENT_LOST",
        message: `${vip.name} (cliente VIP) não volta há ${vip.daysSinceLastVisit} dias. Perda potencial: R$ ${yearlyLoss}/ano. O Growth reativa clientes automaticamente.`,
        lostMoney: yearlyLoss,
        vipClientName: vip.name,
        priority: 2,
      });
    }

    // 9️⃣ TRIGGER_BENCHMARK_NOSHOW
    if (metrics.userNoShowRate > metrics.sectorNoShowRate * 1.5 && canShowTrigger("TRIGGER_BENCHMARK_NOSHOW")) {
      const comparison = Math.round((metrics.userNoShowRate / metrics.sectorNoShowRate - 1) * 100);
      triggers.push({
        type: "TRIGGER_BENCHMARK_NOSHOW",
        message: `Sua taxa de faltas (${metrics.userNoShowRate.toFixed(0)}%) é ${comparison}% maior que a média do setor. O Growth prevê e reduz no-shows automaticamente.`,
        benchmarkComparison: comparison,
        priority: 2,
      });
    }

    // 🔟 TRIGGER_BENCHMARK_OCCUPANCY
    if (metrics.userOccupancyRate < metrics.sectorOccupancyRate * 0.8 && canShowTrigger("TRIGGER_BENCHMARK_OCCUPANCY")) {
      const gap = Math.round(metrics.sectorOccupancyRate - metrics.userOccupancyRate);
      triggers.push({
        type: "TRIGGER_BENCHMARK_OCCUPANCY",
        message: `Sua ocupação (${metrics.userOccupancyRate.toFixed(0)}%) está ${gap}% abaixo da média do setor. O Growth preenche horários automaticamente.`,
        benchmarkComparison: -gap,
        priority: 3,
      });
    }

    // 1️⃣1️⃣ TRIGGER_NO_NEW_SERVICES
    if (metrics.lastServiceAddedDays > 90 && canShowTrigger("TRIGGER_NO_NEW_SERVICES")) {
      triggers.push({
        type: "TRIGGER_NO_NEW_SERVICES",
        message: `Você não adiciona novos serviços há ${Math.round(metrics.lastServiceAddedDays / 30)} meses. Inovar aumenta ticket médio. O Growth sugere serviços baseado em tendências.`,
        priority: 6,
      });
    }

    // 1️⃣2️⃣ TRIGGER_SEASONAL
    if (metrics.scheduledTriggers?.length) {
      const seasonal = metrics.scheduledTriggers[0];
      if (canShowTrigger("TRIGGER_SEASONAL")) {
        triggers.push({
          type: "TRIGGER_SEASONAL",
          message: seasonal.trigger_message,
          seasonalEvent: seasonal.trigger_name,
          priority: seasonal.priority,
        });
      }
    }

    // 1️⃣3️⃣ TRIGGER_HIGH_DEMAND
    if (metrics.dailySlotsFilled >= metrics.dailySlotsTotal * 0.9 && canShowTrigger("TRIGGER_HIGH_DEMAND")) {
      triggers.push({
        type: "TRIGGER_HIGH_DEMAND",
        message: "Sua agenda está 90%+ cheia! Hora de aumentar o ticket médio. O Growth sugere preços dinâmicos automaticamente.",
        priority: 7,
      });
    }

    // 1️⃣4️⃣ TRIGGER_RICH_AREA
    if (metrics.neighborhoodIncomeLevel === "high" && canShowTrigger("TRIGGER_RICH_AREA")) {
      triggers.push({
        type: "TRIGGER_RICH_AREA",
        message: "Você atende clientes de bairros de alto valor. O Growth ativa campanhas premium para atrair mais desse público.",
        priority: 8,
      });
    }

    // 1️⃣5️⃣ TRIGGER_REVENUE_GROWTH
    if (metrics.monthlyRevenue >= 5000 && canShowTrigger("TRIGGER_REVENUE_GROWTH")) {
      triggers.push({
        type: "TRIGGER_REVENUE_GROWTH",
        message: `Sua barbearia já fatura R$ ${metrics.monthlyRevenue.toLocaleString('pt-BR')}/mês. Hora de usar ferramentas profissionais para escalar.`,
        priority: 9,
      });
    }

    // Retornar trigger de maior prioridade
    if (triggers.length === 0) return null;
    return triggers.sort((a, b) => a.priority - b.priority)[0];
  }, [metrics, isStart, planLoading, canShowTrigger]);

  return { evaluateTriggers, recordTriggerShown, canShowTrigger };
};
