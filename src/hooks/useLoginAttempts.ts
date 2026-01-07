import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  success: boolean;
  attempted_at: string;
}

export interface LoginAttemptStats {
  totalAttempts: number;
  successfulLogins: number;
  failedAttempts: number;
  blockedAccounts: number;
  uniqueEmails: number;
}

export const useLoginAttempts = (successFilter?: string) => {
  return useQuery({
    queryKey: ["login-attempts", successFilter],
    queryFn: async () => {
      let query = supabase
        .from("login_attempts")
        .select("*")
        .order("attempted_at", { ascending: false })
        .limit(500);

      if (successFilter === "success") {
        query = query.eq("success", true);
      } else if (successFilter === "failed") {
        query = query.eq("success", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LoginAttempt[];
    },
  });
};

export const useLoginAttemptStats = () => {
  return useQuery({
    queryKey: ["login-attempt-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("login_attempts")
        .select("*")
        .gte("attempted_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const attempts = data || [];
      const uniqueEmails = new Set(attempts.map(a => a.email)).size;
      const successfulLogins = attempts.filter(a => a.success).length;
      const failedAttempts = attempts.filter(a => !a.success).length;

      // Count emails with 5+ failed attempts (blocked)
      const failedByEmail: Record<string, number> = {};
      attempts.filter(a => !a.success).forEach(a => {
        failedByEmail[a.email] = (failedByEmail[a.email] || 0) + 1;
      });
      const blockedAccounts = Object.values(failedByEmail).filter(count => count >= 5).length;

      return {
        totalAttempts: attempts.length,
        successfulLogins,
        failedAttempts,
        blockedAccounts,
        uniqueEmails,
      } as LoginAttemptStats;
    },
  });
};
