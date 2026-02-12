import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlanValidation } from "./usePlanValidation";

export interface UsageCounts {
  clients: number;
  barbers: number;
  appointments: number;
}

export interface UsageLimits {
  maxClients: number;
  maxBarbers: number;
  maxAppointments: number;
}

const START_LIMITS: UsageLimits = {
  maxClients: 100,
  maxBarbers: 3,
  maxAppointments: 100,
};

const GROWTH_LIMITS: UsageLimits = {
  maxClients: Infinity,
  maxBarbers: Infinity,
  maxAppointments: Infinity,
};

export const useUsageLimits = () => {
  const { isStart, isGrowth, loading: planLoading } = usePlanValidation();
  const [counts, setCounts] = useState<UsageCounts>({ clients: 0, barbers: 0, appointments: 0 });
  const [loading, setLoading] = useState(true);

  const limits = isGrowth ? GROWTH_LIMITS : START_LIMITS;

  const fetchCounts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get user's barber IDs first
    const { data: barbers } = await supabase
      .from("barbers")
      .select("id")
      .eq("user_id", user.id);

    const barberIds = barbers?.map(b => b.id) || [];

    const [clientsRes, barbersRes] = await Promise.all([
      supabase
        .from("client_behavior")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("barbers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_active", true),
    ]);

    // Count appointments for user's barbers
    let appointmentCount = 0;
    if (barberIds.length > 0) {
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .in("barber_id", barberIds);
      appointmentCount = count || 0;
    }

    setCounts({
      clients: clientsRes.count || 0,
      barbers: barbersRes.count || 0,
      appointments: appointmentCount,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!planLoading) {
      fetchCounts();
    }
  }, [planLoading, fetchCounts]);

  const checkCanAdd = (resource: "clients" | "barbers" | "appointments"): { allowed: boolean; current: number; max: number } => {
    if (isGrowth) return { allowed: true, current: counts[resource], max: Infinity };

    const limitMap = {
      clients: limits.maxClients,
      barbers: limits.maxBarbers,
      appointments: limits.maxAppointments,
    };

    return {
      allowed: counts[resource] < limitMap[resource],
      current: counts[resource],
      max: limitMap[resource],
    };
  };

  const getUsagePercentage = (resource: "clients" | "barbers" | "appointments"): number => {
    if (isGrowth) return 0;
    const limitMap = {
      clients: limits.maxClients,
      barbers: limits.maxBarbers,
      appointments: limits.maxAppointments,
    };
    return Math.min(100, Math.round((counts[resource] / limitMap[resource]) * 100));
  };

  return {
    counts,
    limits,
    loading: loading || planLoading,
    checkCanAdd,
    getUsagePercentage,
    refetch: fetchCounts,
    isStart,
    isGrowth,
  };
};
