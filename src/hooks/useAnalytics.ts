import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks, format } from "date-fns";
import { 
  getCurrentUser, 
  getUserBarberIds, 
  queryKeys, 
  staleTimes, 
  optimizedSelects,
  dateFilters 
} from "@/lib/supabase-helpers";

interface PeriodData {
  revenue: number;
  profit: number;
  expenses: number;
  appointmentsCount: number;
  salesCount: number;
}

// Função otimizada para buscar dados de um período
async function fetchPeriodData(
  userId: string,
  barberIds: string[],
  start: Date, 
  end: Date
): Promise<PeriodData> {
  const { start: startStr, end: endStr } = dateFilters(start, end);

  // Queries paralelas com selects otimizados
  const [appointmentsResult, expensesResult, salesResult] = await Promise.all([
    // Appointments - apenas price
    barberIds.length > 0 
      ? supabase
          .from('appointments')
          .select('services(price)')
          .in('barber_id', barberIds)
          .eq('status', 'completed')
          .gte('appointment_date', startStr)
          .lte('appointment_date', endStr)
      : { data: [] },
    
    // Expenses - apenas amount
    supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('expense_date', startStr)
      .lte('expense_date', endStr),
    
    // Sales - apenas total_price
    barberIds.length > 0
      ? supabase
          .from('product_sales')
          .select('total_price')
          .in('barber_id', barberIds)
          .gte('sale_date', startStr)
          .lte('sale_date', endStr)
      : { data: [] },
  ]);

  const appointments = appointmentsResult.data || [];
  const expenses = expensesResult.data || [];
  const sales = salesResult.data || [];

  // Cálculos inline sem criar arrays intermediários
  let appointmentsRevenue = 0;
  for (const apt of appointments as any[]) {
    appointmentsRevenue += apt.services?.price || 0;
  }

  let salesRevenue = 0;
  for (const sale of sales) {
    salesRevenue += Number(sale.total_price);
  }

  let totalExpenses = 0;
  for (const exp of expenses) {
    totalExpenses += Number(exp.amount);
  }

  const revenue = appointmentsRevenue + salesRevenue;

  return {
    revenue,
    profit: revenue - totalExpenses,
    expenses: totalExpenses,
    appointmentsCount: appointments.length,
    salesCount: sales.length,
  };
}

function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export const useAnalytics = () => {
  // Período mensal com cache
  const { data: monthlyComparison, isLoading: loadingMonthly } = useQuery({
    queryKey: queryKeys.analyticsMonthly(),
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return null;

      const barberIds = await getUserBarberIds(user.id);
      const now = new Date();

      // Busca paralela dos dois períodos
      const [current, previous] = await Promise.all([
        fetchPeriodData(user.id, barberIds, startOfMonth(now), endOfMonth(now)),
        fetchPeriodData(user.id, barberIds, startOfMonth(subMonths(now, 1)), endOfMonth(subMonths(now, 1))),
      ]);

      return {
        current,
        previous,
        growth: calculateGrowth(current.revenue, previous.revenue),
      };
    },
    staleTime: staleTimes.stable,
    gcTime: staleTimes.veryStable,
  });

  // Período semanal com cache
  const { data: weeklyComparison, isLoading: loadingWeekly } = useQuery({
    queryKey: queryKeys.analyticsWeekly(),
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return null;

      const barberIds = await getUserBarberIds(user.id);
      const now = new Date();

      const [current, previous] = await Promise.all([
        fetchPeriodData(user.id, barberIds, startOfWeek(now), endOfWeek(now)),
        fetchPeriodData(user.id, barberIds, startOfWeek(subWeeks(now, 1)), endOfWeek(subWeeks(now, 1))),
      ]);

      return {
        current,
        previous,
        growth: calculateGrowth(current.revenue, previous.revenue),
      };
    },
    staleTime: staleTimes.stable,
    gcTime: staleTimes.veryStable,
  });

  // Horários de pico - dados agregados
  const { data: peakHours, isLoading: loadingPeakHours } = useQuery({
    queryKey: queryKeys.analyticsPeakHours(),
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [];

      const barberIds = await getUserBarberIds(user.id);
      if (barberIds.length === 0) return [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Select otimizado - apenas campos necessários
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time, services(price)')
        .in('barber_id', barberIds)
        .eq('status', 'completed')
        .gte('appointment_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (error) throw error;

      // Agregação otimizada com Map
      const hourlyData = new Map<number, { count: number; revenue: number }>();
      
      for (const apt of data as any[]) {
        const hour = parseInt(apt.appointment_time.split(':')[0]);
        const existing = hourlyData.get(hour) || { count: 0, revenue: 0 };
        existing.count += 1;
        existing.revenue += apt.services?.price || 0;
        hourlyData.set(hour, existing);
      }

      return Array.from(hourlyData.entries())
        .map(([hour, data]) => ({ hour, ...data }))
        .sort((a, b) => a.hour - b.hour);
    },
    staleTime: staleTimes.stable,
    gcTime: staleTimes.veryStable,
  });

  // Dados históricos - 6 meses
  const { data: historicalData } = useQuery({
    queryKey: queryKeys.analyticsHistorical(),
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [];

      const barberIds = await getUserBarberIds(user.id);
      if (barberIds.length === 0) return [];

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Select mínimo
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date, services(price)')
        .in('barber_id', barberIds)
        .eq('status', 'completed')
        .gte('appointment_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      // Agregação por mês com Map
      const monthlyData = new Map<string, number>();
      
      for (const apt of data as any[]) {
        const month = apt.appointment_date.substring(0, 7);
        monthlyData.set(month, (monthlyData.get(month) || 0) + (apt.services?.price || 0));
      }

      return Array.from(monthlyData.entries()).map(([month, revenue]) => ({
        month,
        revenue,
      }));
    },
    staleTime: staleTimes.veryStable,
    gcTime: staleTimes.static,
  });

  return {
    monthlyComparison,
    loadingMonthly,
    weeklyComparison,
    loadingWeekly,
    peakHours,
    loadingPeakHours,
    historicalData,
  };
};
