import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, format } from "date-fns";

export interface TriggerStats {
  triggerType: string;
  total: number;
  dismissed: number;
  converted: number;
  conversionRate: number;
}

export interface DailyTriggerData {
  date: string;
  total: number;
  converted: number;
}

export interface TriggerAnalytics {
  totalTriggers: number;
  totalConverted: number;
  totalDismissed: number;
  overallConversionRate: number;
  triggersByType: TriggerStats[];
  dailyData: DailyTriggerData[];
  topTriggers: { type: string; count: number }[];
  avgLostMoney: number;
  avgLostClients: number;
}

export const useUpgradeTriggerAnalytics = (days: number = 30) => {
  return useQuery({
    queryKey: ["upgrade-trigger-analytics", days],
    queryFn: async (): Promise<TriggerAnalytics> => {
      const startDate = format(subDays(startOfDay(new Date()), days), "yyyy-MM-dd");
      
      const { data: events, error } = await supabase
        .from("upgrade_trigger_events")
        .select("*")
        .gte("created_at", startDate)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const allEvents = events || [];
      
      // Calculate overall stats
      const totalTriggers = allEvents.length;
      const totalConverted = allEvents.filter(e => e.converted_at).length;
      const totalDismissed = allEvents.filter(e => e.dismissed_at && !e.converted_at).length;
      const overallConversionRate = totalTriggers > 0 ? (totalConverted / totalTriggers) * 100 : 0;

      // Group by trigger type
      const typeGroups = allEvents.reduce((acc, event) => {
        const type = event.trigger_type;
        if (!acc[type]) {
          acc[type] = { total: 0, dismissed: 0, converted: 0 };
        }
        acc[type].total++;
        if (event.converted_at) acc[type].converted++;
        if (event.dismissed_at && !event.converted_at) acc[type].dismissed++;
        return acc;
      }, {} as Record<string, { total: number; dismissed: number; converted: number }>);

      const triggersByType: TriggerStats[] = Object.entries(typeGroups)
        .map(([triggerType, stats]) => ({
          triggerType,
          ...stats,
          conversionRate: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);

      // Daily data for chart
      const dailyGroups = allEvents.reduce((acc, event) => {
        const date = format(new Date(event.created_at), "yyyy-MM-dd");
        if (!acc[date]) {
          acc[date] = { total: 0, converted: 0 };
        }
        acc[date].total++;
        if (event.converted_at) acc[date].converted++;
        return acc;
      }, {} as Record<string, { total: number; converted: number }>);

      const dailyData: DailyTriggerData[] = Object.entries(dailyGroups)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top triggers
      const topTriggers = triggersByType.slice(0, 5).map(t => ({
        type: t.triggerType,
        count: t.total,
      }));

      // Average metrics
      const eventsWithMoney = allEvents.filter(e => e.lost_money != null);
      const avgLostMoney = eventsWithMoney.length > 0
        ? eventsWithMoney.reduce((sum, e) => sum + Number(e.lost_money), 0) / eventsWithMoney.length
        : 0;

      const eventsWithClients = allEvents.filter(e => e.lost_clients != null);
      const avgLostClients = eventsWithClients.length > 0
        ? eventsWithClients.reduce((sum, e) => sum + (e.lost_clients || 0), 0) / eventsWithClients.length
        : 0;

      return {
        totalTriggers,
        totalConverted,
        totalDismissed,
        overallConversionRate,
        triggersByType,
        dailyData,
        topTriggers,
        avgLostMoney,
        avgLostClients,
      };
    },
    staleTime: 60000,
  });
};

// Function to log trigger event - returns the event ID
export const logTriggerEvent = async (
  userId: string,
  triggerType: string,
  triggerMessage?: string,
  metadata?: {
    lostMoney?: number;
    lostClients?: number;
    abandonedBookings?: number;
    manualTimeMinutes?: number;
    noShowCount?: number;
    potentialRevenue?: number;
  }
): Promise<string | null> => {
  const { data, error } = await supabase.from("upgrade_trigger_events").insert({
    user_id: userId,
    trigger_type: triggerType,
    trigger_message: triggerMessage,
    lost_money: metadata?.lostMoney,
    lost_clients: metadata?.lostClients,
    abandoned_bookings: metadata?.abandonedBookings,
    manual_time_minutes: metadata?.manualTimeMinutes,
    no_show_count: metadata?.noShowCount,
    potential_revenue: metadata?.potentialRevenue,
  }).select("id").single();

  if (error) {
    console.error("Failed to log trigger event:", error);
    return null;
  }
  
  return data?.id || null;
};

// Function to mark trigger as dismissed
export const markTriggerDismissed = async (eventId: string) => {
  const { error } = await supabase
    .from("upgrade_trigger_events")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) console.error("Failed to mark trigger dismissed:", error);
};

// Function to mark trigger as converted
export const markTriggerConverted = async (eventId: string) => {
  const { error } = await supabase
    .from("upgrade_trigger_events")
    .update({ converted_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) console.error("Failed to mark trigger converted:", error);
};
