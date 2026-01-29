/**
 * Hook para buscar métricas de crescimento
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { GrowthMetrics, VipClientLost } from "./types";

export const useGrowthMetrics = (isStart: boolean, planLoading: boolean) => {
  return useQuery({
    queryKey: ["growth-trigger-metrics"],
    queryFn: async (): Promise<GrowthMetrics | null> => {
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
        vipClientsQuery,
        sectorBenchmarks,
        lastServiceQuery,
        scheduledTriggersQuery,
      ] = await Promise.all([
        supabase.from("barbers").select("id", { count: "exact" }).eq("user_id", user.id).eq("is_active", true),
        supabase.from("services").select("price, created_at").eq("user_id", user.id).eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("appointments").select("id, status, barber_id").eq("appointment_date", today).in("status", ["scheduled", "confirmed", "completed", "pending"]),
        supabase.from("appointments").select("service_id, services(price)").eq("status", "completed").gte("appointment_date", monthStart).lte("appointment_date", monthEnd),
        supabase.from("appointments").select("service_id, services(price)").eq("status", "completed").gte("appointment_date", prevMonthStart).lte("appointment_date", prevMonthEnd),
        supabase.from("reactivation_queue").select("id", { count: "exact" }).eq("user_id", user.id).eq("status", "pending"),
        supabase.from("neighborhood_stats").select("total_revenue, clients_count").eq("user_id", user.id).order("total_revenue", { ascending: false }).limit(1),
        supabase.from("appointments").select("id", { count: "exact" }).eq("status", "no_show").gte("appointment_date", thirtyDaysAgo),
        supabase.from("appointments").select("id", { count: "exact" }).eq("status", "cancelled").gte("appointment_date", thirtyDaysAgo),
        supabase.from("appointments").select("id", { count: "exact" }).eq("status", "pending").lte("appointment_date", today),
        supabase.from("booking_attempts").select("id", { count: "exact" }).eq("user_id", user.id).not("abandoned_at", "is", null).gte("created_at", sevenDaysAgo),
        supabase.from("manual_process_logs").select("duration_seconds").eq("user_id", user.id).gte("created_at", sevenDaysAgo),
        supabase.from("appointments").select("id, appointment_date, appointment_time").gte("appointment_date", sevenDaysAgo).lte("appointment_date", today).in("status", ["scheduled", "confirmed", "completed"]),
        supabase.from("client_behavior").select("client_name, client_phone, last_appointment_date").eq("user_id", user.id).eq("customer_status", "inactive").gte("customer_score", 80).order("last_appointment_date", { ascending: true }).limit(5),
        supabase.from("sector_benchmarks").select("metric_name, avg_value, p50_value").in("metric_name", ["no_show_rate", "occupancy_rate"]),
        supabase.from("services").select("created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
        supabase.from("scheduled_triggers").select("trigger_type, trigger_name, trigger_message, priority").eq("is_active", true).lte("start_date", today).gte("end_date", today).contains("target_plans", ["start"]),
      ]);

      // Calculate avg ticket
      const prices = servicesResult.data?.map(s => Number(s.price)) || [];
      const avgTicket = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 50;

      // Calculate revenues
      const monthlyRevenue = completedAppointments.data?.reduce((sum, apt) => sum + (Number((apt.services as any)?.price) || 0), 0) || 0;
      const previousMonthRevenue = prevMonthAppointments.data?.reduce((sum, apt) => sum + (Number((apt.services as any)?.price) || 0), 0) || 0;

      // Calculate slots
      const barberCount = barbersResult.count || 1;
      const dailySlotsTotal = barberCount * 16;
      const dailySlotsFilled = appointmentsToday.data?.length || 0;

      // Determine income level
      const topNeighborhood = neighborhoodResult.data?.[0];
      let neighborhoodIncomeLevel: "low" | "medium" | "high" = "medium";
      if (topNeighborhood) {
        const avgRevenuePerClient = (topNeighborhood.total_revenue || 0) / (topNeighborhood.clients_count || 1);
        if (avgRevenuePerClient > 150) neighborhoodIncomeLevel = "high";
        else if (avgRevenuePerClient < 50) neighborhoodIncomeLevel = "low";
      }

      // Manual time
      const totalManualSeconds = manualProcessResult.data?.reduce((sum, log) => sum + (log.duration_seconds || 0), 0) || 0;

      // Empty slots avg
      const weeklySlotsByDay: Record<string, number> = {};
      weeklyAppointments.data?.forEach(apt => {
        weeklySlotsByDay[apt.appointment_date as string] = (weeklySlotsByDay[apt.appointment_date as string] || 0) + 1;
      });
      const daysWithData = Object.keys(weeklySlotsByDay).length || 1;
      const avgSlotsFilledPerDay = Object.values(weeklySlotsByDay).reduce((a, b) => a + b, 0) / daysWithData;
      const emptySlots7dAvg = Math.max(0, dailySlotsTotal - avgSlotsFilledPerDay);

      // VIP clients
      const vipClientsLost: VipClientLost[] = (vipClientsQuery.data || []).map(c => {
        const lastVisit = c.last_appointment_date ? new Date(c.last_appointment_date) : new Date();
        const daysSince = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
        return { name: c.client_name || "Cliente VIP", phone: c.client_phone || "", avgTicket: avgTicket * 1.5, daysSinceLastVisit: daysSince };
      }).filter(c => c.daysSinceLastVisit > 60);

      // Benchmarks
      const benchmarks = sectorBenchmarks.data || [];
      const noShowBenchmark = benchmarks.find(b => b.metric_name === "no_show_rate");
      const occupancyBenchmark = benchmarks.find(b => b.metric_name === "occupancy_rate");
      
      const totalAppointments30d = (noShowAppointments.count || 0) + (cancelledAppointments.count || 0) + (completedAppointments.data?.length || 0);
      const userNoShowRate = totalAppointments30d > 0 ? ((noShowAppointments.count || 0) / totalAppointments30d) * 100 : 0;
      const userOccupancyRate = dailySlotsTotal > 0 ? (dailySlotsFilled / dailySlotsTotal) * 100 : 0;

      // Last service days
      const lastServiceDate = lastServiceQuery.data?.[0]?.created_at;
      const lastServiceAddedDays = lastServiceDate ? Math.floor((Date.now() - new Date(lastServiceDate).getTime()) / (1000 * 60 * 60 * 24)) : 999;

      // Recurring empty slots
      const slotCounts: Record<string, number> = {};
      weeklyAppointments.data?.forEach(apt => { slotCounts[apt.appointment_time] = (slotCounts[apt.appointment_time] || 0) + 1; });
      const recurringEmptySlots = Object.entries(slotCounts).filter(([_, count]) => count <= 1).map(([time]) => time);

      return {
        avgTicket,
        monthlyRevenue,
        previousMonthRevenue,
        dailySlotsTotal,
        dailySlotsFilled,
        lostClients30d: lostClientsResult.count || 0,
        neighborhoodIncomeLevel,
        barberCount,
        featureAccessAttempts: [],
        noShowLast30d: noShowAppointments.count || 0,
        cancelledLast30d: cancelledAppointments.count || 0,
        notConfirmedLast30d: notConfirmedAppointments.count || 0,
        abandonedBookings7d: abandonedBookingsResult.count || 0,
        manualTimeMinutes7d: Math.round(totalManualSeconds / 60),
        emptySlots7dAvg,
        lastServiceAddedDays,
        vipClientsLost,
        recurringEmptySlots,
        refusedAppointments7d: 0,
        sectorNoShowRate: noShowBenchmark?.avg_value || 12.5,
        sectorOccupancyRate: occupancyBenchmark?.avg_value || 65,
        userNoShowRate,
        userOccupancyRate,
        scheduledTriggers: (scheduledTriggersQuery.data || []) as any,
      };
    },
    enabled: !planLoading && isStart,
    staleTime: 5 * 60 * 1000,
  });
};
