/**
 * Tipos do Growth Trigger Engine
 * Refatorado de useGrowthTriggerEngine.ts para melhor manutenibilidade
 */

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
  benchmarkComparison?: number;
  commissionLost?: number;
  vipClientName?: string;
  seasonalEvent?: string;
  priority: number;
}

export interface VipClientLost {
  name: string;
  phone: string;
  avgTicket: number;
  daysSinceLastVisit: number;
}

export interface ScheduledTrigger {
  trigger_type: TriggerType;
  trigger_name: string;
  trigger_message: string;
  priority: number;
}

export interface GrowthMetrics {
  avgTicket: number;
  monthlyRevenue: number;
  previousMonthRevenue: number;
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
  // Métricas Fase 2 e 3
  lastServiceAddedDays: number;
  vipClientsLost: VipClientLost[];
  recurringEmptySlots: string[];
  refusedAppointments7d: number;
  // Benchmarks
  sectorNoShowRate: number;
  sectorOccupancyRate: number;
  userNoShowRate: number;
  userOccupancyRate: number;
  // Gatilhos sazonais
  scheduledTriggers?: ScheduledTrigger[];
}

// Constantes
export const TRIGGER_STORAGE_KEY = "gestbarber_last_trigger";
export const TRIGGER_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 horas
