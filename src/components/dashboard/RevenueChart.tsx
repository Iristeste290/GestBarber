import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export const RevenueChart = () => {
  const endDate = new Date();
  const startDate = subDays(endDate, 29);

  const { data: chartData = [] } = useQuery({
    queryKey: ["revenue-chart", format(startDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Buscar barbeiros do usuário
      const { data: userBarbers } = await supabase
        .from("barbers")
        .select("id")
        .eq("user_id", user.id);
      
      const barberIds = userBarbers?.map(b => b.id) || [];
      if (barberIds.length === 0) return [];

      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("appointment_date, services(price)")
        .in("barber_id", barberIds)
        .eq("status", "completed")
        .gte("appointment_date", format(startDate, "yyyy-MM-dd"))
        .lte("appointment_date", format(endDate, "yyyy-MM-dd"));

      if (error) throw error;

      const revenueByDate: Record<string, number> = {};
      appointments?.forEach((apt) => {
        const date = apt.appointment_date;
        const price = Number(apt.services?.price) || 0;
        revenueByDate[date] = (revenueByDate[date] || 0) + price;
      });

      const data = [];
      for (let i = 29; i >= 0; i--) {
        const date = format(subDays(endDate, i), "yyyy-MM-dd");
        data.push({
          date: format(subDays(endDate, i), "dd/MM", { locale: ptBR }),
          revenue: revenueByDate[date] || 0,
        });
      }
      return data;
    },
    staleTime: 300000, // 5 minutos
  });

  const chartConfig = {
    revenue: {
      label: "Faturamento",
      color: "hsl(var(--primary))",
    },
  };

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const averageRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;

  return (
    <Card className="overflow-hidden contain-content">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg md:text-xl font-semibold">
              Faturamento dos Últimos 30 Dias
            </CardTitle>
            <CardDescription className="text-sm">
              Receita diária de agendamentos concluídos
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(totalRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Média: {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(averageRevenue)}/dia
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-6">
        <ChartContainer config={chartConfig} className="h-[280px] sm:h-[320px] w-full">
          <AreaChart 
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              strokeOpacity={0.3}
              vertical={false}
            />
            <XAxis 
              dataKey="date" 
              tick={{ 
                fill: "hsl(var(--muted-foreground))",
                fontSize: 11
              }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))", strokeOpacity: 0.3 }}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis 
              tick={{ 
                fill: "hsl(var(--muted-foreground))",
                fontSize: 11
              }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => 
                new Intl.NumberFormat('pt-BR', { 
                  notation: 'compact',
                  compactDisplay: 'short',
                  style: 'currency',
                  currency: 'BRL'
                }).format(value)
              }
              width={60}
            />
            <ChartTooltip 
              content={<ChartTooltipContent 
                labelFormatter={(label) => `Data: ${label}`}
                formatter={(value) => [
                  new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(value as number),
                  'Faturamento'
                ]}
              />}
              cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeOpacity: 0.3 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2
              }}
              animationDuration={400}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
