import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "./useRequireAuth";

export type PlanType = "freemium" | "mensal" | "anual";

export interface PlanLimits {
  maxBarbers: number;
  maxAppointmentsPerMonth: number;
  maxServices: number;
  maxProducts: number;
  hasAutomation: boolean;
  hasAI: boolean;
  hasAdvancedReports: boolean;
  hasWeeklyGoals: boolean;
  hasAdvancedStock: boolean;
  hasForecast: boolean;
  hasRanking: boolean;
  hasSmartScheduler: boolean;
  hasAIPosts: boolean;
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

const PLAN_CONFIGS: Record<PlanType, PlanLimits> = {
  freemium: {
    maxBarbers: 2,
    maxAppointmentsPerMonth: 50,
    maxServices: 10,
    maxProducts: 5,
    hasAutomation: false,
    hasAI: false,
    hasAdvancedReports: false,
    hasWeeklyGoals: false,
    hasAdvancedStock: false,
    hasForecast: false,
    hasRanking: false,
    hasSmartScheduler: false,
    hasAIPosts: false,
    hasPayments: false,
    supportLevel: "none",
  },
  mensal: {
    maxBarbers: Infinity,
    maxAppointmentsPerMonth: Infinity,
    maxServices: Infinity,
    maxProducts: Infinity,
    hasAutomation: true,
    hasAI: true,
    hasAdvancedReports: true,
    hasWeeklyGoals: true,
    hasAdvancedStock: true,
    hasForecast: true,
    hasRanking: true,
    hasSmartScheduler: true,
    hasAIPosts: true,
    hasPayments: true,
    supportLevel: "email",
  },
  anual: {
    maxBarbers: Infinity,
    maxAppointmentsPerMonth: Infinity,
    maxServices: Infinity,
    maxProducts: Infinity,
    hasAutomation: true,
    hasAI: true,
    hasAdvancedReports: true,
    hasWeeklyGoals: true,
    hasAdvancedStock: true,
    hasForecast: true,
    hasRanking: true,
    hasSmartScheduler: true,
    hasAIPosts: true,
    hasPayments: true,
    supportLevel: "email_priority",
  },
};

export const usePlanValidation = () => {
  const { user } = useRequireAuth();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar plano:", error);
        // Fallback seguro: se não der pra ler o plano, assume Freemium
        const planType: PlanType = "freemium";
        setUserPlan({
          plan: planType,
          status: "active",
          limits: PLAN_CONFIGS[planType],
          currentPeriodEnd: null,
          isExpired: false,
        });
        setLoading(false);
        return;
      }

      const planType = (data?.plan_type || "freemium") as PlanType;
      const endDate = data?.end_date || data?.current_period_end;
      const status = data?.status || "active";
      
      // Verificar se o plano expirou (freemium ou pago)
      let isExpired = false;
      if (endDate) {
        const expirationDate = new Date(endDate);
        const now = new Date();
        isExpired = expirationDate < now;
      }
      
      // Também considerar expirado se o status não for "active"
      if (status !== "active" && status !== "trialing") {
        isExpired = true;
      }

      setUserPlan({
        plan: planType,
        status: data?.status || "active",
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

    let tableName = resource;
    let max = 0;
    
    switch (resource) {
      case "barbers":
        max = userPlan.limits.maxBarbers;
        break;
      case "services":
        max = userPlan.limits.maxServices;
        break;
      case "products":
        max = userPlan.limits.maxProducts;
        break;
      case "appointments":
        tableName = resource;
        max = userPlan.limits.maxAppointmentsPerMonth;
        break;
    }

    let count = 0;

    if (resource === "barbers" || resource === "services" || resource === "products") {
      const query: any = supabase.from(tableName).select("id", { count: "exact", head: true });
      const filtered: any = query.eq("user_id", user.id);
      const result: any = await filtered;
      count = result.count || 0;
    } else if (resource === "appointments") {
      // Count appointments this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const barbersQuery: any = supabase.from("barbers").select("id");
      const barbersFiltered: any = barbersQuery.eq("user_id", user.id);
      const barbersResult: any = await barbersFiltered;
      
      if (barbersResult.data && barbersResult.data.length > 0) {
        const barberIds = barbersResult.data.map((b: any) => b.id);
        const appointmentsQuery: any = supabase.from(tableName).select("id", { count: "exact", head: true });
        const filtered1: any = appointmentsQuery.in("barber_id", barberIds);
        const filtered2: any = filtered1.gte("appointment_date", startOfMonth.toISOString().split('T')[0]);
        const result: any = await filtered2;
        count = result.count || 0;
      }
    }

    const current = count;

    return {
      allowed: current < max,
      current,
      max,
    };
  };

  return {
    userPlan,
    loading,
    canUseFeature,
    checkLimit,
    isPremium: userPlan?.plan !== "freemium",
    isFreemium: userPlan?.plan === "freemium",
    isAnnualPremium: userPlan?.plan === "anual",
  };
};