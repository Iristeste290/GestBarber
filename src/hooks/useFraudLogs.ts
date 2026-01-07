import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FraudLog {
  id: string;
  ip_address: string;
  device_id: string | null;
  user_id: string | null;
  status: string;
  reason: string | null;
  user_agent: string | null;
  attempt_date: string;
  created_at: string;
}

export interface FraudStats {
  ip_address: string;
  total_attempts: number;
  successful_registrations: number;
  blocked_attempts: number;
  warnings: number;
  first_attempt: string;
  last_attempt: string;
  unique_devices: number;
}

export const useFraudLogs = (statusFilter?: string) => {
  return useQuery({
    queryKey: ["fraud-logs", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("ip_fraud_logs")
        .select("*")
        .order("attempt_date", { ascending: false })
        .limit(500);

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FraudLog[];
    },
  });
};

export const useFraudStats = () => {
  return useQuery({
    queryKey: ["fraud-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ip_fraud_stats")
        .select("*")
        .limit(100);

      if (error) throw error;
      return data as FraudStats[];
    },
  });
};

export const useFraudChartData = () => {
  return useQuery({
    queryKey: ["fraud-chart-data"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("ip_fraud_logs")
        .select("attempt_date, status")
        .gte("attempt_date", thirtyDaysAgo.toISOString())
        .order("attempt_date", { ascending: true });

      if (error) throw error;

      // Group by date
      const groupedData: Record<string, { date: string; allowed: number; blocked: number; warning: number }> = {};

      data?.forEach((log) => {
        const date = new Date(log.attempt_date).toLocaleDateString("pt-BR");
        if (!groupedData[date]) {
          groupedData[date] = { date, allowed: 0, blocked: 0, warning: 0 };
        }
        if (log.status === "allowed") groupedData[date].allowed++;
        else if (log.status === "blocked") groupedData[date].blocked++;
        else if (log.status === "warning") groupedData[date].warning++;
      });

      return Object.values(groupedData);
    },
  });
};
