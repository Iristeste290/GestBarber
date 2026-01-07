import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Scissors } from "lucide-react";
import { toast } from "sonner";

interface AgendaCalendarProps {
  viewMode: "day" | "tomorrow" | "week" | "month";
  selectedBarber: string;
  selectedService: string;
  onAppointmentClick: (appointmentId: string) => void;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string;
  customer_name: string | null;
  customer_phone: string | null;
  barber: { name: string };
  service: { name: string; duration_minutes: number };
  profile: { full_name: string } | null;
}

export const AgendaCalendar = ({
  viewMode,
  selectedBarber,
  selectedService,
  onAppointmentClick,
}: AgendaCalendarProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
    
    const channel = supabase
      .channel('appointments-changes')
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
  }, [viewMode, selectedBarber, selectedService]);

  const getDateRange = () => {
    const today = new Date();
    
    switch (viewMode) {
      case "day":
        return { start: today, end: today };
      case "tomorrow":
        const tomorrow = addDays(today, 1);
        return { start: tomorrow, end: tomorrow };
      case "week":
        return { start: startOfWeek(today, { locale: ptBR }), end: endOfWeek(today, { locale: ptBR }) };
      case "month":
        return { start: startOfMonth(today), end: endOfMonth(today) };
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAppointments([]);
        return;
      }

      // Buscar barbeiros do usuário
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
          service:services(name, duration_minutes),
          profile:profiles(full_name)
        `)
        .in("barber_id", barberIds)
        .gte("appointment_date", format(start, "yyyy-MM-dd"))
        .lte("appointment_date", format(end, "yyyy-MM-dd"))
        .neq("status", "cancelled")
        .order("appointment_date")
        .order("appointment_time");

      if (selectedBarber !== "all") {
        query = query.eq("barber_id", selectedBarber);
      }

      if (selectedService !== "all") {
        query = query.eq("service_id", selectedService);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setAppointments(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar agendamentos");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      completed: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "Pendente",
      confirmed: "Confirmado",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return (
      <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="p-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
      </div>
    );
  }

  const groupAppointmentsByDate = () => {
    const grouped: { [key: string]: Appointment[] } = {};
    
    appointments.forEach((appointment) => {
      const date = appointment.appointment_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(appointment);
    });

    return grouped;
  };

  const renderDayView = () => {
    const groupedAppointments = groupAppointmentsByDate();
    
    if (loading) {
      return <div className="text-center py-6 md:py-8 text-muted-foreground text-sm md:text-base">Carregando...</div>;
    }

    if (appointments.length === 0) {
      return <div className="text-center py-6 md:py-8 text-muted-foreground text-sm md:text-base">Nenhum agendamento encontrado</div>;
    }

    return (
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {Object.entries(groupedAppointments).map(([date, dayAppointments]) => (
          <div key={date}>
            <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 px-1">
              {format(new Date(date + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <div className="grid gap-2 md:gap-3">
              {dayAppointments.map((appointment) => (
                <Card
                  key={appointment.id}
                  className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1"
                  onClick={() => onAppointmentClick(appointment.id)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1.5 md:space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-semibold text-sm md:text-base">
                            {appointment.appointment_time.substring(0, 5)}
                          </span>
                          <Badge className={`${getStatusColor(appointment.status)} text-xs`}>
                            {getStatusLabel(appointment.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm">
                          <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{appointment.customer_name || appointment.profile?.full_name || "Cliente não identificado"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm">
                          <Scissors className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{appointment.service.name}</span>
                          <span className="text-muted-foreground hidden sm:inline">•</span>
                          <span className="text-muted-foreground hidden sm:inline">{appointment.service.duration_minutes} min</span>
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground truncate">
                          Barbeiro: {appointment.barber.name}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card key={viewMode} className="animate-fade-in">
      <CardHeader className="px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
        <CardTitle className="text-base md:text-xl">Agendamentos</CardTitle>
      </CardHeader>
      <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
        {renderDayView()}
      </CardContent>
    </Card>
  );
};
