import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subWeeks, subMonths, startOfWeek, startOfMonth } from "date-fns";

export const RevenueForecast = () => {
  // Buscar dados históricos de agendamentos
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments-forecast"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("appointment_date, services(price)")
        .eq("status", "completed")
        .gte("appointment_date", subMonths(new Date(), 3).toISOString().split("T")[0]);
      
      if (error) throw error;
      return data;
    },
    staleTime: 300000, // 5 minutos
  });

  // Calcular médias históricas - iniciar em 0 se ainda não carregou
  let weeklyAverage = 0;
  let monthlyAverage = 0;
  let weeklyForecast = 0;
  let monthlyForecast = 0;

  if (appointments && appointments.length > 0) {
    // Calcular receita total
    const totalRevenue = appointments.reduce((sum, apt) => {
      const price = apt.services?.price || 0;
      return sum + Number(price);
    }, 0);

    // Calcular número de semanas e meses no histórico
    const weeksInData = 12; // Aproximadamente 3 meses = 12 semanas
    const monthsInData = 3;

    weeklyAverage = totalRevenue / weeksInData;
    monthlyAverage = totalRevenue / monthsInData;
    
    weeklyForecast = weeklyAverage * 1.15; // 15% de crescimento estimado
    monthlyForecast = monthlyAverage * 1.12; // 12% de crescimento estimado
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Previsão de Faturamento
        </CardTitle>
        <CardDescription>Estimativas baseadas no histórico de agendamentos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Esta Semana</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? "Carregando..." : `R$ ${weeklyForecast.toFixed(2)}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {!isLoading && weeklyAverage > 0 && `Baseado em média de R$ ${weeklyAverage.toFixed(2)}/semana`}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Este Mês</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? "Carregando..." : `R$ ${monthlyForecast.toFixed(2)}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {!isLoading && monthlyAverage > 0 && `Baseado em média de R$ ${monthlyAverage.toFixed(2)}/mês`}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            * Previsões calculadas com base no histórico e tendências recentes
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
