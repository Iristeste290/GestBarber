import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Modelo: Start (gratuito para sempre) vs Growth (pago)
export type PlanType = "start" | "growth";

export interface PlanLimits {
  // Recursos básicos (ambos planos)
  maxBarbers: number;
  maxAppointmentsPerMonth: number;
  maxServices: number;
  maxProducts: number;
  hasBasicReports: boolean;
  
  // Recursos Growth exclusivos
  hasGrowthEngine: boolean;
  hasEmptySlots: boolean;
  hasInactiveClients: boolean;
  hasProblematicClients: boolean;
  hasRanking: boolean;
  hasClientMap: boolean;
  hasAIWebsite: boolean;
  hasSEOLocal: boolean;
  hasMoneyLostAlerts: boolean;
  hasAutomation: boolean;
  hasAIPosts: boolean;
  hasAdvancedReports: boolean;
  hasForecast: boolean;
  hasSmartScheduler: boolean;
  hasPayments: boolean;
  supportLevel: "none" | "email" | "email_priority";
}

export interface UserPlan {
  plan: PlanType;
  status: string;
  limits: PlanLimits;
  currentPeriodEnd: string | null;
  isExpired: boolean;
}

// Configuração dos planos
const PLAN_CONFIGS: Record<PlanType, PlanLimits> = {
  start: {
    // Start: Recursos básicos gratuitos para sempre
    maxBarbers: Infinity,
    maxAppointmentsPerMonth: Infinity,
    maxServices: Infinity,
    maxProducts: Infinity,
    hasBasicReports: true,
    
    // Recursos Growth bloqueados no Start
    hasGrowthEngine: false,
    hasEmptySlots: false,
    hasInactiveClients: false,
    hasProblematicClients: false,
    hasRanking: false,
    hasClientMap: false,
    hasAIWebsite: false,
    hasSEOLocal: false,
    hasMoneyLostAlerts: false,
    hasAutomation: false,
    hasAIPosts: false,
    hasAdvancedReports: false,
    hasForecast: false,
    hasSmartScheduler: false,
    hasPayments: false,
    supportLevel: "none",
  },
  growth: {
    // Recursos básicos inclusos
    maxBarbers: Infinity,
    maxAppointmentsPerMonth: Infinity,
    maxServices: Infinity,
    maxProducts: Infinity,
    hasBasicReports: true,
    
    // Todos os recursos Growth desbloqueados
    hasGrowthEngine: true,
    hasEmptySlots: true,
    hasInactiveClients: true,
    hasProblematicClients: true,
    hasRanking: true,
    hasClientMap: true,
    hasAIWebsite: true,
    hasSEOLocal: true,
    hasMoneyLostAlerts: true,
    hasAutomation: true,
    hasAIPosts: true,
    hasAdvancedReports: true,
    hasForecast: true,
    hasSmartScheduler: true,
    hasPayments: true,
    supportLevel: "email_priority",
  },
};

// Mapeamento de planos antigos para novos
const LEGACY_PLAN_MAP: Record<string, PlanType> = {
  freemium: "start",
  mensal: "growth",
  anual: "growth",
};

export const usePlanValidation = () => {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Obter usuário SEM redirecionar (evita loop em páginas públicas como /auth)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user === null) {
      // Usuário não logado - definir plano default sem redirecionar
      setUserPlan({
        plan: "start",
        status: "none",
        limits: PLAN_CONFIGS["start"],
        currentPeriodEnd: null,
        isExpired: false,
      });
      setLoading(false);
      return;
    }

    if (!user) {
      return; // Ainda carregando
    }

    const fetchPlan = async () => {
      // Buscar dados do profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, subscription_status")
        .eq("id", user.id)
        .single();

      const subscriptionStatus = profile?.subscription_status || "none";

      // Buscar subscription do Stripe (se existir)
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar plano:", error);
      }

      // Mapear plano antigo para novo modelo
      const legacyPlan = data?.plan_type || profile?.plan || "start";
      const planType: PlanType = LEGACY_PLAN_MAP[legacyPlan] || (legacyPlan === "growth" ? "growth" : "start");
      
      const endDate = data?.end_date || data?.current_period_end;
      const status = data?.status || subscriptionStatus;
      
      // Verificar se o plano Growth expirou
      let isExpired = false;
      if (endDate && planType === "growth") {
        const expirationDate = new Date(endDate);
        const now = new Date();
        isExpired = expirationDate < now && status !== "active";
      }

      setUserPlan({
        plan: planType,
        status: status,
        limits: PLAN_CONFIGS[planType],
        currentPeriodEnd: data?.current_period_end || null,
        isExpired,
      });
      setLoading(false);
    };

    fetchPlan();

    // Realtime subscription changes
    const channel = supabase
      .channel(`subscription-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchPlan();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const canUseFeature = (feature: keyof PlanLimits): boolean => {
    if (!userPlan) return false;
    return Boolean(userPlan.limits[feature]);
  };

  const checkLimit = async (
    resource: "barbers" | "services" | "products" | "appointments"
  ) => {
    if (!user || !userPlan) {
      return { allowed: false, current: 0, max: 0 };
    }

    // No modelo, Start tem recursos básicos ilimitados
    return {
      allowed: true,
      current: 0,
      max: Infinity,
    };
  };

  return {
    userPlan,
    loading,
    canUseFeature,
    checkLimit,
    isGrowth: userPlan?.plan === "growth",
    isStart: userPlan?.plan === "start",
    // Aliases para compatibilidade
    isPremium: userPlan?.plan === "growth",
    isFreemium: userPlan?.plan === "start",
    isAnnualPremium: false,
  };
};
