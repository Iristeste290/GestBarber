import { memo, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowRight } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { OptimizedAvatar } from "@/components/ui/optimized-image";
import { useFormatters } from "@/hooks/usePerformance";

interface BarberStats {
  id: string;
  name: string;
  avatar_url: string | null;
  appointments: number;
  revenue: number;
}

// Memoized barber item component
const BarberRankingItem = memo(function BarberRankingItem({
  barber,
  index,
  formatCurrency
}: {
  barber: BarberStats;
  index: number;
  formatCurrency: (value: number) => string;
}) {
  const medalColor = useMemo(() => {
    if (index === 0) return "text-yellow-500";
    if (index === 1) return "text-gray-400";
    if (index === 2) return "text-amber-600";
    return "text-muted-foreground";
  }, [index]);

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-lg border bg-card transition-colors-fast hover:bg-accent/50"
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Trophy className={`w-4 h-4 sm:w-5 sm:h-5 ${medalColor}`} />
          <span className="font-bold text-base sm:text-lg text-muted-foreground">
            #{index + 1}
          </span>
        </div>
        <OptimizedAvatar
          src={barber.avatar_url}
          alt={barber.name}
          fallbackText={barber.name}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{barber.name}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {barber.appointments} atendimento{barber.appointments !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <Badge variant={index === 0 ? "default" : "secondary"} className="text-sm self-start sm:self-center">
        {formatCurrency(barber.revenue)}
      </Badge>
    </div>
  );
});

export const BarberRanking = memo(function BarberRanking() {
  const navigate = useNavigate();
  const { formatCurrency } = useFormatters();
  
  const firstDayOfMonth = useMemo(() => 
    format(startOfMonth(new Date()), "yyyy-MM-dd"), 
  []);

  const { data: ranking = [] } = useQuery<BarberStats[]>({
    queryKey: ["barber-ranking", firstDayOfMonth],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: userBarbers } = await supabase
        .from("barbers")
        .select("id")
        .eq("user_id", user.id);
      
      const barberIds = userBarbers?.map(b => b.id) || [];
      if (barberIds.length === 0) return [];

      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("barber_id, barbers(id, name, avatar_url), services(price)")
        .in("barber_id", barberIds)
        .eq("status", "completed")
        .gte("appointment_date", firstDayOfMonth);

      if (error) throw error;

      const barberStats: Record<string, BarberStats> = {};
      appointments?.forEach((apt) => {
        if (apt.barbers) {
          const barberId = apt.barbers.id;
          if (!barberStats[barberId]) {
            barberStats[barberId] = {
              id: barberId,
              name: apt.barbers.name,
              avatar_url: apt.barbers.avatar_url,
              appointments: 0,
              revenue: 0,
            };
          }
          barberStats[barberId].appointments++;
          barberStats[barberId].revenue += Number(apt.services?.price || 0);
        }
      });

      return Object.values(barberStats)
        .sort((a, b) => b.revenue - a.revenue);
    },
    staleTime: 60000,
  });

  const handleNavigate = useCallback(() => {
    navigate("/barbeiros");
  }, [navigate]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg sm:text-xl">Ranking dos Barbeiros</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Performance mensal - ordenado por faturamento</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleNavigate} className="w-full sm:w-auto transition-gpu">
            Ver Todos
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4 contain-layout">
          {ranking.map((barber, index) => (
            <BarberRankingItem 
              key={barber.id}
              barber={barber}
              index={index}
              formatCurrency={formatCurrency}
            />
          ))}
          {ranking.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhum atendimento registrado este mês
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
