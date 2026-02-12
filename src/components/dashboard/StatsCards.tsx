import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendIndicator } from "@/components/ui/trend-indicator";
import { DollarSign, Calendar, TrendingUp } from "lucide-react";
import { format, subDays } from "date-fns";
import { memo, useEffect } from "react";

const StatsCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </CardContent>
  </Card>
);

interface StatsCardsProps {
  isDemo?: boolean;
}

export const StatsCards = memo(({ isDemo = false }: StatsCardsProps) => {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  // Realtime subscription para atualizar quando agendamentos mudarem
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          // Invalidar cache para forçar re-fetch
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["revenue-chart"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", today, yesterday],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Buscar barbeiros do usuário
      const { data: userBarbers } = await supabase
        .from("barbers")
        .select("id")
        .eq("user_id", user.id);
      
      const barberIds = userBarbers?.map(b => b.id) || [];
      if (barberIds.length === 0) {
        return {
          todayRevenue: 0,
          todayAppointments: 0,
          averageTicket: 0,
          criticalProducts: 0,
          revenueTrend: 0,
          appointmentsTrend: 0,
          avgTicketTrend: 0,
        };
      }

      // Queries paralelas para hoje e ontem
      const [todayResult, yesterdayResult] = await Promise.all([
        supabase
          .from("appointments")
          .select("*, services(price)")
          .in("barber_id", barberIds)
          .eq("appointment_date", today)
          .eq("status", "completed"),
        supabase
          .from("appointments")
          .select("*, services(price)")
          .in("barber_id", barberIds)
          .eq("appointment_date", yesterday)
          .eq("status", "completed"),
      ]);

      // Calcular estatísticas de hoje
      const todayAppointments = todayResult.data || [];
      const todayCount = todayAppointments.length;
      const todayRevenue = todayAppointments.reduce((sum, apt) => 
        sum + (Number(apt.services?.price) || 0), 0
      );
      const todayAvgTicket = todayCount > 0 ? todayRevenue / todayCount : 0;

      // Calcular estatísticas de ontem
      const yesterdayAppointments = yesterdayResult.data || [];
      const yesterdayCount = yesterdayAppointments.length;
      const yesterdayRevenue = yesterdayAppointments.reduce((sum, apt) => 
        sum + (Number(apt.services?.price) || 0), 0
      );
      const yesterdayAvgTicket = yesterdayCount > 0 ? yesterdayRevenue / yesterdayCount : 0;

      // Calcular tendências (percentual de mudança)
      const revenueTrend = yesterdayRevenue > 0 
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
        : todayRevenue > 0 ? 100 : 0;
      
      const appointmentsTrend = yesterdayCount > 0 
        ? ((todayCount - yesterdayCount) / yesterdayCount) * 100 
        : todayCount > 0 ? 100 : 0;
      
      const avgTicketTrend = yesterdayAvgTicket > 0 
        ? ((todayAvgTicket - yesterdayAvgTicket) / yesterdayAvgTicket) * 100 
        : todayAvgTicket > 0 ? 100 : 0;
      
      return {
        todayRevenue,
        todayAppointments: todayCount,
        averageTicket: todayAvgTicket,
        revenueTrend,
        appointmentsTrend,
        avgTicketTrend,
      };
    },
    staleTime: 30000, // 30 segundos
    refetchInterval: 60000, // Atualiza a cada 1 minuto
  });

  // Dados fictícios para conta demo
  const demoStats = {
    todayRevenue: 1250.00,
    todayAppointments: 14,
    averageTicket: 89.29,
    revenueTrend: 12.5,
    appointmentsTrend: 8.3,
    avgTicketTrend: 3.7,
  };

  const displayStats = isDemo ? demoStats : stats;

  if (isLoading && !isDemo) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
    );
  }


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      <Card className="contain-content border-primary/20 hover:border-primary/40 transition-colors hover:shadow-gold">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Hoje</CardTitle>
          <div className="p-2 bg-primary/10 rounded-full">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="text-xl md:text-2xl font-bold text-primary">
            R$ {displayStats?.todayRevenue.toFixed(2) || "0.00"}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              Serviços concluídos
            </p>
            {displayStats?.revenueTrend !== undefined && (
              <TrendIndicator value={displayStats.revenueTrend} />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="contain-content hover:border-primary/30 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
          <CardTitle className="text-sm font-medium text-muted-foreground">Agendamentos Hoje</CardTitle>
          <div className="p-2 bg-success/10 rounded-full">
            <Calendar className="h-4 w-4 text-success" />
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="text-xl md:text-2xl font-bold text-foreground">
            {displayStats?.todayAppointments || 0}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              Concluídos
            </p>
            {displayStats?.appointmentsTrend !== undefined && (
              <TrendIndicator value={displayStats.appointmentsTrend} />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="contain-content hover:border-primary/30 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
          <div className="p-2 bg-accent/10 rounded-full">
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="text-xl md:text-2xl font-bold text-foreground">
            R$ {displayStats?.averageTicket.toFixed(2) || "0.00"}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              Por agendamento
            </p>
            {displayStats?.avgTicketTrend !== undefined && (
              <TrendIndicator value={displayStats.avgTicketTrend} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
