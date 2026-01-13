import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface BarbershopPerformance {
  id: string;
  user_id: string;
  total_revenue: number;
  occupancy_rate: number;
  retention_rate: number;
  no_show_rate: number;
  avg_ticket: number;
  performance_score: number;
  performance_percentile: number;
  clients_count: number;
  appointments_count: number;
  calculated_at: string;
}

export const useBarbershopPerformance = () => {
  return useQuery({
    queryKey: ['barbershop-performance'],
    queryFn: async (): Promise<BarbershopPerformance | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('barbershop_performance')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as BarbershopPerformance | null;
    },
  });
};

export const useCalculatePerformance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get barber IDs
      const { data: barbers } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user.id);

      const barberIds = barbers?.map(b => b.id) || [];
      
      // Get current month data
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      // Get appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, status, service_id, client_id, services(price)')
        .in('barber_id', barberIds)
        .gte('appointment_date', start)
        .lte('appointment_date', end);

      const allAppointments = appointments || [];
      const completedAppointments = allAppointments.filter(a => a.status === 'completed');
      const noShowAppointments = allAppointments.filter(a => a.status === 'no_show');

      // Calculate metrics
      const totalRevenue = completedAppointments.reduce((sum, apt) => {
        const price = (apt.services as any)?.price || 0;
        return sum + Number(price);
      }, 0);

      const avgTicket = completedAppointments.length > 0 
        ? totalRevenue / completedAppointments.length 
        : 0;

      const noShowRate = allAppointments.length > 0 
        ? (noShowAppointments.length / allAppointments.length) * 100 
        : 0;

      // Get unique clients
      const uniqueClients = new Set(allAppointments.map(a => a.client_id));
      const clientsCount = uniqueClients.size;

      // Calculate retention (clients with >1 appointment)
      const clientAppointmentCounts = new Map<string, number>();
      allAppointments.forEach(a => {
        const count = clientAppointmentCounts.get(a.client_id) || 0;
        clientAppointmentCounts.set(a.client_id, count + 1);
      });
      const returningClients = Array.from(clientAppointmentCounts.values()).filter(c => c > 1).length;
      const retentionRate = clientsCount > 0 ? (returningClients / clientsCount) * 100 : 0;

      // Calculate occupancy (simplified: appointments vs capacity)
      // Assuming 8 slots per day, 22 work days, per barber
      const totalCapacity = barberIds.length * 8 * 22;
      const occupancyRate = totalCapacity > 0 
        ? (allAppointments.length / totalCapacity) * 100 
        : 0;

      // Calculate performance score (0-100)
      let performanceScore = 50;
      performanceScore += Math.min(occupancyRate * 0.3, 30); // Max +30 for occupancy
      performanceScore += Math.min(retentionRate * 0.2, 20); // Max +20 for retention
      performanceScore -= noShowRate * 0.5; // Penalty for no-shows
      performanceScore = Math.max(0, Math.min(100, performanceScore));

      // Get all performances to calculate percentile
      const { data: allPerformances } = await supabase
        .from('barbershop_performance')
        .select('performance_score')
        .order('performance_score', { ascending: true });

      let percentile = 50;
      if (allPerformances && allPerformances.length > 0) {
        const lowerScores = allPerformances.filter(p => p.performance_score < performanceScore).length;
        percentile = Math.round((lowerScores / allPerformances.length) * 100);
      }

      // Upsert performance
      const { data, error } = await supabase
        .from('barbershop_performance')
        .upsert({
          user_id: user.id,
          total_revenue: totalRevenue,
          occupancy_rate: Math.round(occupancyRate * 10) / 10,
          retention_rate: Math.round(retentionRate * 10) / 10,
          no_show_rate: Math.round(noShowRate * 10) / 10,
          avg_ticket: Math.round(avgTicket * 100) / 100,
          performance_score: Math.round(performanceScore),
          performance_percentile: percentile,
          clients_count: clientsCount,
          appointments_count: allAppointments.length,
          calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbershop-performance'] });
    },
  });
};
