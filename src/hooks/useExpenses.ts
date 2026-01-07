import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleError, handleSuccess } from "@/lib/error-handler";
import { queryKeys, staleTimes } from "@/lib/supabase-helpers";

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
}

export const useExpenses = (userId?: string) => {
  const queryClient = useQueryClient();

  // Despesas - select otimizado
  const { data: expenses = [], isLoading: loadingExpenses } = useQuery<Expense[]>({
    queryKey: queryKeys.expenses(userId),
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select('id, description, category, amount, expense_date')
        .eq('user_id', userId)
        .order('expense_date', { ascending: false })
        .limit(100); // Limita quantidade

      if (error) {
        handleError(error, { title: "Erro ao carregar despesas" });
        throw error;
      }
      return data || [];
    },
    enabled: !!userId,
    staleTime: staleTimes.frequent,
  });

  // Receita total - query separada com cache longo
  const { data: totalRevenue = 0, isLoading: loadingRevenue } = useQuery({
    queryKey: ['total-revenue', userId],
    queryFn: async () => {
      if (!userId) return 0;

      // Busca barbeiros do usuário primeiro
      const { data: barbers } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', userId);

      const barberIds = barbers?.map(b => b.id) || [];
      if (barberIds.length === 0) return 0;

      // Apenas price para somar
      const { data, error } = await supabase
        .from('appointments')
        .select('services(price)')
        .in('barber_id', barberIds)
        .eq('status', 'completed');

      if (error) {
        handleError(error, { title: "Erro ao carregar receita" });
        throw error;
      }
      
      let total = 0;
      for (const apt of (data || []) as any[]) {
        total += apt.services?.price || 0;
      }

      return total;
    },
    enabled: !!userId,
    staleTime: staleTimes.moderate,
  });

  // Mutation para adicionar
  const addExpenseMutation = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id'>) => {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          user_id: userId,
          description: expense.description,
          category: expense.category,
          amount: expense.amount,
          expense_date: expense.expense_date,
        }])
        .select('id, description, category, amount, expense_date')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newExpense) => {
      // Atualização otimista
      queryClient.setQueryData<Expense[]>(queryKeys.expenses(userId), (old = []) => {
        return [newExpense, ...old];
      });
      handleSuccess("Despesa cadastrada", "A despesa foi adicionada com sucesso");
    },
    onError: (error) => {
      handleError(error, { title: "Erro ao adicionar despesa" });
    },
  });

  // Mutation para deletar
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      // Cancela queries em andamento
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses(userId) });
      
      // Snapshot do estado anterior
      const previousExpenses = queryClient.getQueryData<Expense[]>(queryKeys.expenses(userId));
      
      // Atualização otimista
      queryClient.setQueryData<Expense[]>(queryKeys.expenses(userId), (old = []) => {
        return old.filter(e => e.id !== id);
      });
      
      return { previousExpenses };
    },
    onError: (error, _, context) => {
      // Rollback em caso de erro
      if (context?.previousExpenses) {
        queryClient.setQueryData(queryKeys.expenses(userId), context.previousExpenses);
      }
      handleError(error, { title: "Erro ao excluir despesa" });
    },
    onSuccess: () => {
      handleSuccess("Despesa excluída", "A despesa foi removida com sucesso");
    },
  });

  // Cálculos memorizados inline
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  // Agregação por categoria
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  return {
    expenses,
    loadingExpenses,
    totalRevenue,
    loadingRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    expensesByCategory,
    addExpense: addExpenseMutation.mutate,
    deleteExpense: deleteExpenseMutation.mutate,
    isAddingExpense: addExpenseMutation.isPending,
    isDeletingExpense: deleteExpenseMutation.isPending,
  };
};
