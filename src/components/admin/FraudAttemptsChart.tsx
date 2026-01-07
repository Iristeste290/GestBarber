import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useFraudChartData } from "@/hooks/useFraudLogs";

const chartConfig = {
  allowed: {
    label: "Permitidas",
    color: "hsl(142, 76%, 36%)",
  },
  blocked: {
    label: "Bloqueadas",
    color: "hsl(0, 84%, 60%)",
  },
  warning: {
    label: "Alertas",
    color: "hsl(45, 93%, 47%)",
  },
} satisfies ChartConfig;

export const FraudAttemptsChart = () => {
  const { data: chartData, isLoading } = useFraudChartData();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tentativas ao Longo do Tempo</CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tentativas ao Longo do Tempo</CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          <p>Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tentativas ao Longo do Tempo</CardTitle>
        <CardDescription>Últimos 30 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="allowed"
                stroke="hsl(142, 76%, 36%)"
                fillOpacity={1}
                fill="url(#colorAllowed)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="warning"
                stroke="hsl(45, 93%, 47%)"
                fillOpacity={1}
                fill="url(#colorWarning)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="blocked"
                stroke="hsl(0, 84%, 60%)"
                fillOpacity={1}
                fill="url(#colorBlocked)"
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
