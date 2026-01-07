import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, queryKeys, staleTimes } from "@/lib/supabase-helpers";

export const useBarberStats = (barberId: string) => {
  // Metas da semana atual
  const { data: goals, isLoading: loadingGoals } = useQuery({
    queryKey: queryKeys.barberGoals(barberId),
    queryFn: async () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const { data, error } = await supabase
        .from('barber_goals')
        .select('id, target_haircuts, current_haircuts, target_avg_ticket, current_avg_ticket, target_product_sales, current_product_sales')
        .eq('barber_id', barberId)
        .gte('week_start_date', startOfWeek.toISOString().split('T')[0])
        .lte('week_end_date', endOfWeek.toISOString().split('T')[0])
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    staleTime: staleTimes.moderate,
    enabled: !!barberId,
  });

  // Agendamentos de hoje - otimizado
  const today = new Date().toISOString().split('T')[0];
  
  const { data: todayAppointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: queryKeys.barberAppointments(barberId, today),
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) return [];

      // Verifica propriedade e busca appointments em uma query
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_time,
          status,
          customer_name,
          services(name, price),
          profiles(full_name)
        `)
        .eq('barber_id', barberId)
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: staleTimes.frequent,
    refetchInterval: staleTimes.moderate,
    enabled: !!barberId,
  });

  // Comissões do mês - otimizado
  const { data: monthCommissions, isLoading: loadingCommissions } = useQuery({
    queryKey: queryKeys.barberCommissions(barberId),
    queryFn: async () => {
      const firstDay = new Date();
      firstDay.setDate(1);
      const firstDayStr = firstDay.toISOString().split('T')[0];

      // Queries paralelas
      const [barberResult, appointmentsResult, salesResult] = await Promise.all([
        supabase
          .from('barbers')
          .select('commission_percentage')
          .eq('id', barberId)
          .single(),
        supabase
          .from('appointments')
          .select('services(price)')
          .eq('barber_id', barberId)
          .eq('status', 'completed')
          .gte('appointment_date', firstDayStr),
        supabase
          .from('product_sales')
          .select('total_price')
          .eq('barber_id', barberId)
          .gte('sale_date', firstDayStr),
      ]);

      const commissionRate = barberResult.data?.commission_percentage || 10;
      
      let appointmentsTotal = 0;
      for (const apt of (appointmentsResult.data || []) as any[]) {
        appointmentsTotal += apt.services?.price || 0;
      }

      let salesTotal = 0;
      for (const sale of salesResult.data || []) {
        salesTotal += Number(sale.total_price);
      }

      const total = appointmentsTotal + salesTotal;

      return {
        total,
        commission: (total * commissionRate) / 100,
        commissionRate,
        appointmentsTotal,
        salesTotal,
      };
    },
    staleTime: staleTimes.moderate,
    enabled: !!barberId,
  });

  // Performance 30 dias - otimizado
  const { data: performance = [], isLoading: loadingPerformance } = useQuery({
    queryKey: ['barber-performance', barberId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date, services(price)')
        .eq('barber_id', barberId)
        .eq('status', 'completed')
        .gte('appointment_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      // Agregação com Map
      const grouped = new Map<string, { date: string; revenue: number; count: number }>();
      
      for (const apt of data as any[]) {
        const date = apt.appointment_date;
        const existing = grouped.get(date) || { date, revenue: 0, count: 0 };
        existing.revenue += apt.services?.price || 0;
        existing.count += 1;
        grouped.set(date, existing);
      }

      return Array.from(grouped.values());
    },
    staleTime: staleTimes.stable,
    enabled: !!barberId,
  });

  return {
    goals,
    loadingGoals,
    todayAppointments,
    loadingAppointments,
    monthCommissions,
    loadingCommissions,
    performance,
    loadingPerformance,
  };
};
