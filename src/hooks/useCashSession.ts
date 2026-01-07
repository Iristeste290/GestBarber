import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, startOfMonth } from "date-fns";
import { handleError, handleSuccess } from "@/lib/error-handler";

export interface CashSession {
  id: string;
  opening_amount: number;
  is_open: boolean;
  opened_at: string;
}

export interface CashTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export const useCashSession = (userId?: string) => {
  const queryClient = useQueryClient();

  const { data: session, isLoading: sessionLoading } = useQuery<CashSession | null>({
    queryKey: ["cash-session", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("cash_register_sessions")
        .select("*")
        .eq("is_open", true)
        .gte("opened_at", `${today}T00:00:00`)
        .lte("opened_at", `${today}T23:59:59`)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 30000,
  });

  const { data: dailyTransactions = [] } = useQuery<CashTransaction[]>({
    queryKey: ["daily-transactions", session?.id],
    queryFn: async () => {
      if (!session?.id) return [];
      
      const { data, error } = await supabase
        .from("cash_transactions")
        .select("*")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!session?.id,
    staleTime: 10000,
  });

  const { data: weeklyRevenue = 0 } = useQuery({
    queryKey: ["weekly-revenue", userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      // Buscar sessões do usuário primeiro
      const { data: userSessions } = await supabase
        .from("cash_register_sessions")
        .select("id")
        .eq("user_id", userId);
      
      const sessionIds = userSessions?.map(s => s.id) || [];
      if (sessionIds.length === 0) return 0;

      const weekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("cash_transactions")
        .select("amount")
        .in("session_id", sessionIds)
        .eq("transaction_type", "entrada")
        .gte("created_at", `${weekStart}T00:00:00`);

      if (error) throw error;
      return data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    },
    enabled: !!userId,
    staleTime: 60000,
  });

  const { data: monthlyRevenue = 0 } = useQuery({
    queryKey: ["monthly-revenue", userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      // Buscar sessões do usuário primeiro
      const { data: userSessions } = await supabase
        .from("cash_register_sessions")
        .select("id")
        .eq("user_id", userId);
      
      const sessionIds = userSessions?.map(s => s.id) || [];
      if (sessionIds.length === 0) return 0;

      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("cash_transactions")
        .select("amount")
        .in("session_id", sessionIds)
        .eq("transaction_type", "entrada")
        .gte("created_at", `${monthStart}T00:00:00`);

      if (error) throw error;
      return data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    },
    enabled: !!userId,
    staleTime: 60000,
  });

  // Realtime
  useEffect(() => {
    if (!session?.id) return;

    const channel = supabase
      .channel('cash-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cash_transactions',
          filter: `session_id=eq.${session.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["daily-transactions"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id, queryClient]);

  const openSession = async (amount: number) => {
    if (!userId) {
      handleError(new Error("Usuário não autenticado"));
      return false;
    }

    try {
      const { error } = await supabase
        .from("cash_register_sessions")
        .insert({
          user_id: userId,
          opening_amount: amount,
          is_open: true,
        });

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["cash-session"] });
      handleSuccess("Caixa aberto", "Sessão iniciada com sucesso");
      return true;
    } catch (error) {
      handleError(error, { title: "Erro ao abrir caixa" });
      return false;
    }
  };

  const closeSession = async (closingAmount: number, notes: string) => {
    if (!session) return false;

    try {
      const { error } = await supabase
        .from("cash_register_sessions")
        .update({
          is_open: false,
          closed_at: new Date().toISOString(),
          closing_amount: closingAmount,
          notes,
        })
        .eq("id", session.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["cash-session"] });
      handleSuccess("Caixa fechado", "Sessão encerrada com sucesso");
      return true;
    } catch (error) {
      handleError(error, { title: "Erro ao fechar caixa" });
      return false;
    }
  };

  const addTransaction = async (
    type: string,
    amount: number,
    description: string
  ) => {
    if (!session) {
      handleError(new Error("Nenhuma sessão aberta"));
      return false;
    }

    try {
      const { error } = await supabase
        .from("cash_transactions")
        .insert({
          session_id: session.id,
          transaction_type: type,
          amount,
          description,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["daily-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["weekly-revenue"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-revenue"] });
      handleSuccess("Transação registrada", "Movimentação adicionada com sucesso");
      return true;
    } catch (error) {
      handleError(error, { title: "Erro ao registrar transação" });
      return false;
    }
  };

  const dailyBalance = dailyTransactions.reduce((sum, t) => {
    return sum + (t.transaction_type === "entrada" ? Number(t.amount) : -Number(t.amount));
  }, session?.opening_amount || 0);

  return {
    session,
    sessionLoading,
    dailyTransactions,
    weeklyRevenue,
    monthlyRevenue,
    dailyBalance,
    openSession,
    closeSession,
    addTransaction,
  };
};