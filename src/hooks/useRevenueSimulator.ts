import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format, differenceInDays } from "date-fns";

export interface SimulatorData {
  avgTicket: number;
  cutsPerDay: number;
  workDaysPerMonth: number;
  currentMonthlyRevenue: number;
}

export interface SimulationResult {
  targetValue: number;
  currentRevenue: number;
  gap: number;
  optionA: {
    extraClientsPerDay: number;
    description: string;
  };
  optionB: {
    ticketIncrease: number;
    newTicket: number;
    description: string;
  };
  optionC: {
    extraDaysPerMonth: number;
    description: string;
  };
}

export const useSimulatorData = () => {
  return useQuery({
    queryKey: ['simulator-data'],
    queryFn: async (): Promise<SimulatorData> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { avgTicket: 0, cutsPerDay: 0, workDaysPerMonth: 22, currentMonthlyRevenue: 0 };
      }

      // Get barber IDs
      const { data: barbers } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user.id);

      const barberIds = barbers?.map(b => b.id) || [];
      if (barberIds.length === 0) {
        return { avgTicket: 0, cutsPerDay: 0, workDaysPerMonth: 22, currentMonthlyRevenue: 0 };
      }

      // Get current month data
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const daysInMonth = differenceInDays(endOfMonth(new Date()), startOfMonth(new Date())) + 1;

      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, appointment_date, service_id, services(price)')
        .in('barber_id', barberIds)
        .eq('status', 'completed')
        .gte('appointment_date', start)
        .lte('appointment_date', end);

      if (!appointments || appointments.length === 0) {
        return { avgTicket: 0, cutsPerDay: 0, workDaysPerMonth: 22, currentMonthlyRevenue: 0 };
      }

      // Calculate metrics
      const totalRevenue = appointments.reduce((sum, apt) => {
        const price = (apt.services as any)?.price || 0;
        return sum + Number(price);
      }, 0);

      const avgTicket = totalRevenue / appointments.length;
      
      // Count unique work days
      const uniqueDays = new Set(appointments.map(a => a.appointment_date));
      const workDays = uniqueDays.size;
      const cutsPerDay = workDays > 0 ? appointments.length / workDays : 0;

      // Estimate work days per month (based on current pattern)
      const dayOfMonth = new Date().getDate();
      const projectedWorkDays = Math.round((workDays / dayOfMonth) * daysInMonth);

      return {
        avgTicket: Math.round(avgTicket * 100) / 100,
        cutsPerDay: Math.round(cutsPerDay * 10) / 10,
        workDaysPerMonth: projectedWorkDays || 22,
        currentMonthlyRevenue: totalRevenue,
      };
    },
  });
};

export const calculateSimulation = (
  data: SimulatorData,
  targetValue: number
): SimulationResult => {
  const { avgTicket, cutsPerDay, workDaysPerMonth, currentMonthlyRevenue } = data;
  
  const gap = targetValue - currentMonthlyRevenue;
  
  // Option A: Extra clients per day
  const revenuePerClient = avgTicket;
  const extraClientsNeeded = gap / revenuePerClient;
  const extraClientsPerDay = workDaysPerMonth > 0 
    ? extraClientsNeeded / workDaysPerMonth 
    : 0;

  // Option B: Increase ticket
  const currentTotalClients = cutsPerDay * workDaysPerMonth;
  const newTicketNeeded = currentTotalClients > 0 
    ? targetValue / currentTotalClients 
    : avgTicket;
  const ticketIncrease = newTicketNeeded - avgTicket;

  // Option C: Extra work days
  const revenuePerDay = cutsPerDay * avgTicket;
  const extraDaysNeeded = revenuePerDay > 0 ? gap / revenuePerDay : 0;

  return {
    targetValue,
    currentRevenue: currentMonthlyRevenue,
    gap,
    optionA: {
      extraClientsPerDay: Math.round(extraClientsPerDay * 10) / 10,
      description: `Atender +${Math.ceil(extraClientsPerDay)} cliente(s) por dia`,
    },
    optionB: {
      ticketIncrease: Math.round(ticketIncrease * 100) / 100,
      newTicket: Math.round(newTicketNeeded * 100) / 100,
      description: `Aumentar ticket médio em R$ ${ticketIncrease.toFixed(2)}`,
    },
    optionC: {
      extraDaysPerMonth: Math.ceil(extraDaysNeeded),
      description: `Trabalhar +${Math.ceil(extraDaysNeeded)} dia(s) por mês`,
    },
  };
};
