import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendIndicator } from "@/components/ui/trend-indicator";
import { 
  Scissors, 
  DollarSign, 
  TrendingUp,
  Calendar
} from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/exportUtils";

interface MonthlyBreakdown {
  servicesRevenue: number;
  totalRevenue: number;
  expenses: number;
  profit: number;
  servicesCount: number;
  avgServiceTicket: number;
}

export const CombinedMonthlyReport = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["combined-monthly-report"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: userBarbers } = await supabase
        .from("barbers")
        .select("id")
        .eq("user_id", user.id);
      
      const barberIds = userBarbers?.map(b => b.id) || [];
      
      const now = new Date();
      const currentStart = format(startOfMonth(now), "yyyy-MM-dd");
      const currentEnd = format(endOfMonth(now), "yyyy-MM-dd");
      const prevStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
      const prevEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

      // Buscar dados do mês atual
      const [
        currentAppointments,
        currentExpenses,
        prevAppointments
      ] = await Promise.all([
        barberIds.length > 0
          ? supabase
              .from("appointments")
              .select("*, services(price, name)")
              .in("barber_id", barberIds)
              .eq("status", "completed")
              .gte("appointment_date", currentStart)
              .lte("appointment_date", currentEnd)
          : { data: [] },
        supabase
          .from("expenses")
          .select("amount, category")
          .eq("user_id", user.id)
          .gte("expense_date", currentStart)
          .lte("expense_date", currentEnd),
        barberIds.length > 0
          ? supabase
              .from("appointments")
              .select("services(price)")
              .in("barber_id", barberIds)
              .eq("status", "completed")
              .gte("appointment_date", prevStart)
              .lte("appointment_date", prevEnd)
          : { data: [] },
      ]);

      const appointments = currentAppointments.data || [];
      const expenses = currentExpenses.data || [];

      // Calcular valores do mês atual
      const servicesRevenue = appointments.reduce((sum, apt: any) => 
        sum + (Number(apt.services?.price) || 0), 0
      );
      const totalExpenses = expenses.reduce((sum, exp) => 
        sum + Number(exp.amount), 0
      );

      // Calcular valores do mês anterior
      const prevServicesRevenue = (prevAppointments.data || []).reduce((sum, apt: any) => 
        sum + (Number(apt.services?.price) || 0), 0
      );

      const current: MonthlyBreakdown = {
        servicesRevenue,
        totalRevenue: servicesRevenue,
        expenses: totalExpenses,
        profit: servicesRevenue - totalExpenses,
        servicesCount: appointments.length,
        avgServiceTicket: appointments.length > 0 ? servicesRevenue / appointments.length : 0,
      };

      const previous = {
        servicesRevenue: prevServicesRevenue,
        totalRevenue: prevServicesRevenue,
      };

      // Top serviços
      const serviceBreakdown = new Map<string, { count: number; revenue: number }>();
      for (const apt of appointments as any[]) {
        const name = apt.services?.name || 'Desconhecido';
        const existing = serviceBreakdown.get(name) || { count: 0, revenue: 0 };
        existing.count++;
        existing.revenue += Number(apt.services?.price) || 0;
        serviceBreakdown.set(name, existing);
      }

      return {
        current,
        previous,
        topServices: Array.from(serviceBreakdown.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5),
        monthName: format(now, "MMMM 'de' yyyy", { locale: ptBR }),
      };
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { current, previous, topServices, monthName } = data;

  const servicesGrowth = previous.servicesRevenue > 0
    ? ((current.servicesRevenue - previous.servicesRevenue) / previous.servicesRevenue) * 100
    : current.servicesRevenue > 0 ? 100 : 0;

  const totalGrowth = previous.totalRevenue > 0
    ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100
    : current.totalRevenue > 0 ? 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold capitalize">{monthName}</h3>
        </div>
        <Badge variant="outline" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          Relatório Mensal
        </Badge>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(current.totalRevenue)}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">vs mês anterior</span>
              <TrendIndicator value={totalGrowth} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <Scissors className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(current.servicesRevenue)}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {current.servicesCount} atendimentos
              </span>
              <TrendIndicator value={servicesGrowth} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${current.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(current.profit)}
            </div>
            <span className="text-xs text-muted-foreground">
              Despesas: {formatCurrency(current.expenses)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Top Serviços e Ticket Médio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Top Serviços do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topServices.length > 0 ? (
              <div className="space-y-3">
                {topServices.map((service, i) => (
                  <div key={i} className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/50">
                    <span className="truncate max-w-[60%]">{service.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {service.count}x
                      </Badge>
                      <span className="font-medium">{formatCurrency(service.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum serviço registrado este mês
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <Scissors className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio por Serviço</p>
                <p className="text-xl font-bold">{formatCurrency(current.avgServiceTicket)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
