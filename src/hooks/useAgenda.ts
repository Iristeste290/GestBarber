import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string;
  customer_name: string | null;
  customer_phone: string | null;
  barber: { name: string };
  service: { name: string; duration_minutes: number; price?: number };
  profile: { full_name: string } | null;
  checked_in_at?: string | null;
  payment_status?: string | null;
  payment_method?: string | null;
}

type ViewMode = "day" | "tomorrow" | "week" | "month";

interface UseAgendaOptions {
  viewMode: ViewMode;
  selectedDate: Date;
  selectedBarber: string;
  selectedService: string;
  selectedStatus: string;
}

export const useAgenda = ({
  viewMode,
  selectedDate,
  selectedBarber,
  selectedService,
  selectedStatus,
}: UseAgendaOptions) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDateRange = useCallback(() => {
    switch (viewMode) {
      case "day":
        return { start: selectedDate, end: selectedDate };
      case "tomorrow":
        const tomorrow = addDays(new Date(), 1);
        return { start: tomorrow, end: tomorrow };
      case "week":
        return { 
          start: startOfWeek(selectedDate, { locale: ptBR }), 
          end: endOfWeek(selectedDate, { locale: ptBR }) 
        };
      case "month":
        return { 
          start: startOfMonth(selectedDate), 
          end: endOfMonth(selectedDate) 
        };
    }
  }, [viewMode, selectedDate]);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { start, end } = getDateRange();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAppointments([]);
        return;
      }

      // Fetch user's barbers
      const { data: userBarbers } = await supabase
        .from("barbers")
        .select("id")
        .eq("user_id", user.id);
      
      const barberIds = userBarbers?.map(b => b.id) || [];
      if (barberIds.length === 0) {
        setAppointments([]);
        return;
      }

      let query = supabase
        .from("appointments")
        .select(`
          *,
          barber:barbers(name),
          service:services(name, duration_minutes, price),
          profile:profiles(full_name)
        `)
        .in("barber_id", barberIds)
        .gte("appointment_date", format(start, "yyyy-MM-dd"))
        .lte("appointment_date", format(end, "yyyy-MM-dd"))
        .order("appointment_date")
        .order("appointment_time");

      // Apply filters
      if (selectedBarber !== "all") {
        query = query.eq("barber_id", selectedBarber);
      }

      if (selectedService !== "all") {
        query = query.eq("service_id", selectedService);
      }

      if (selectedStatus !== "all") {
        query = query.eq("status", selectedStatus);
      } else {
        // By default, don't show cancelled
        query = query.neq("status", "cancelled");
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      
      setAppointments(data || []);
    } catch (err: any) {
      console.error("Error loading appointments:", err);
      setError("Erro ao carregar agendamentos");
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  }, [getDateRange, selectedBarber, selectedService, selectedStatus]);

  const updateAppointmentStatus = useCallback(async (appointmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status })
        .eq("id", appointmentId);

      if (error) throw error;

      // Update local state optimistically
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status } : apt
        )
      );

      const statusLabels: Record<string, string> = {
        confirmed: "confirmado",
        completed: "concluído",
        cancelled: "cancelado",
        pending: "pendente",
        no_show: "marcado como não compareceu",
      };

      toast.success(`Agendamento ${statusLabels[status] || status}!`);
    } catch (err: any) {
      console.error("Error updating appointment:", err);
      toast.error("Erro ao atualizar agendamento");
    }
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    loadAppointments();
    
    const channel = supabase
      .channel('agenda-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          loadAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAppointments]);

  // Group appointments by date
  const groupedAppointments = appointments.reduce<Record<string, Appointment[]>>((acc, apt) => {
    const date = apt.appointment_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(apt);
    return acc;
  }, {});

  return {
    appointments,
    groupedAppointments,
    loading,
    error,
    refresh: loadAppointments,
    updateStatus: updateAppointmentStatus,
  };
};
