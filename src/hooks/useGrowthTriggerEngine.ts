import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlanValidation } from "./usePlanValidation";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

// Tipos de gatilhos
export type TriggerType = 
  | "TRIGGER_EMPTY_SLOTS"
  | "TRIGGER_LOST_CLIENTS"
  | "TRIGGER_HIGH_DEMAND"
  | "TRIGGER_RICH_AREA"
  | "TRIGGER_REVENUE_GROWTH"
  | "TRIGGER_FEATURE_BLOCK";

export interface UpgradeTrigger {
  type: TriggerType;
  message: string;
  lostMoney?: number;
  lostClients?: number;
  featureName?: string;
  priority: number; // 1 = highest
}

export interface GrowthMetrics {
  avgTicket: number;
  monthlyRevenue: number;
  dailySlotsTotal: number;
  dailySlotsFilled: number;
  lostClients30d: number;
  neighborhoodIncomeLevel: "low" | "medium" | "high";
  barberCount: number;
  featureAccessAttempts: string[];
}

const TRIGGER_STORAGE_KEY = "gestbarber_last_trigger";
const TRIGGER_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 horas entre triggers do mesmo tipo

export const useGrowthTriggerEngine = () => {
  const { isGrowth, isStart, loading: planLoading } = usePlanValidation();
  const [activeTrigger, setActiveTrigger] = useState<UpgradeTrigger | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggeredRef = useRef(false);

  // 📊 Buscar métricas da barbearia
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ["growth-trigger-metrics"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const today = format(new Date(), "yyyy-MM-dd");
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      // Parallel queries for performance
      const [
        barbersResult,
        servicesResult,
        appointmentsToday,
        completedAppointments,
        lostClientsResult,
        neighborhoodResult,
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
          .select("price")
          .eq("user_id", user.id)
          .eq("is_active", true),
        
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

      return {
        avgTicket,
        monthlyRevenue,
        dailySlotsTotal,
        dailySlotsFilled,
        lostClients30d,
        neighborhoodIncomeLevel,
        barberCount,
        featureAccessAttempts: [],
      } as GrowthMetrics;
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

  // 🎯 Avaliar gatilhos
  const evaluateTriggers = useCallback((): UpgradeTrigger | null => {
    if (!metrics || !isStart || planLoading) return null;

    const triggers: UpgradeTrigger[] = [];

    // 1️⃣ TRIGGER_EMPTY_SLOTS - Horários vazios
    const emptySlots = metrics.dailySlotsTotal - metrics.dailySlotsFilled;
    if (emptySlots > 0) {
      const lostMoney = Math.round(emptySlots * metrics.avgTicket);
      if (lostMoney > 50 && canShowTrigger("TRIGGER_EMPTY_SLOTS")) {
        triggers.push({
          type: "TRIGGER_EMPTY_SLOTS",
          message: `Você deixou de ganhar R$ ${lostMoney} hoje por falta de automação.`,
          lostMoney,
          priority: 1,
        });
      }
    }

    // 2️⃣ TRIGGER_LOST_CLIENTS - Clientes sumidos
    if (metrics.lostClients30d >= 5 && canShowTrigger("TRIGGER_LOST_CLIENTS")) {
      const lostRevenue = Math.round(metrics.lostClients30d * metrics.avgTicket * 2);
      triggers.push({
        type: "TRIGGER_LOST_CLIENTS",
        message: `${metrics.lostClients30d} clientes não voltaram. Isso pode ser R$ ${lostRevenue} perdidos.`,
        lostMoney: lostRevenue,
        lostClients: metrics.lostClients30d,
        priority: 2,
      });
    }

    // 3️⃣ TRIGGER_HIGH_DEMAND - Agenda cheia
    if (
      metrics.dailySlotsFilled >= metrics.dailySlotsTotal * 0.9 &&
      canShowTrigger("TRIGGER_HIGH_DEMAND")
    ) {
      triggers.push({
        type: "TRIGGER_HIGH_DEMAND",
        message: "Sua agenda está lotada. O Growth aumenta o ticket médio automaticamente.",
        priority: 3,
      });
    }

    // 4️⃣ TRIGGER_RICH_AREA - Bairro de alto valor
    if (
      metrics.neighborhoodIncomeLevel === "high" &&
      canShowTrigger("TRIGGER_RICH_AREA")
    ) {
      triggers.push({
        type: "TRIGGER_RICH_AREA",
        message: "Você atende clientes de alto valor. O Growth ativa campanhas automáticas nesse bairro.",
        priority: 4,
      });
    }

    // 5️⃣ TRIGGER_REVENUE_GROWTH - Crescimento financeiro
    if (metrics.monthlyRevenue >= 5000 && canShowTrigger("TRIGGER_REVENUE_GROWTH")) {
      triggers.push({
        type: "TRIGGER_REVENUE_GROWTH",
        message: "Sua barbearia já fatura alto. Hora de usar ferramentas profissionais.",
        priority: 5,
      });
    }

    // Retornar o trigger de maior prioridade
    if (triggers.length === 0) return null;
    return triggers.sort((a, b) => a.priority - b.priority)[0];
  }, [metrics, isStart, planLoading, canShowTrigger]);

  // 6️⃣ TRIGGER_FEATURE_BLOCK - Tentativa de acessar função premium
  const triggerFeatureBlock = useCallback((featureName: string) => {
    if (!isStart || isGrowth) return;

    const trigger: UpgradeTrigger = {
      type: "TRIGGER_FEATURE_BLOCK",
      message: `"${featureName}" faz parte do plano Growth — ela existe para fazer sua barbearia ganhar mais dinheiro.`,
      featureName,
      priority: 0, // Highest priority
    };

    setActiveTrigger(trigger);
    setIsModalOpen(true);
    recordTriggerShown("TRIGGER_FEATURE_BLOCK");
  }, [isStart, isGrowth, recordTriggerShown]);

  // 🔄 Rodar avaliação de triggers
  useEffect(() => {
    if (planLoading || !isStart || triggeredRef.current) return;
    
    const trigger = evaluateTriggers();
    if (trigger) {
      // Delay para não aparecer imediatamente ao carregar
      const timer = setTimeout(() => {
        setActiveTrigger(trigger);
        setIsModalOpen(true);
        recordTriggerShown(trigger.type);
        triggeredRef.current = true;
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
