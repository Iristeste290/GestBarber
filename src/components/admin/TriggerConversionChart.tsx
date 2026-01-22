import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DailyTriggerData } from "@/hooks/useUpgradeTriggerAnalytics";

interface TriggerConversionChartProps {
  data: DailyTriggerData[];
}

const chartConfig = {
  total: {
    label: "Disparados",
    color: "hsl(var(--primary))",
  },
  converted: {
    label: "Convertidos",
    color: "hsl(var(--success))",
  },
};

export const TriggerConversionChart = ({ data }: TriggerConversionChartProps) => {
  const formattedData = data.map(item => ({
    ...item,
    dateFormatted: format(parseISO(item.date), "dd/MM", { locale: ptBR }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gatilhos por Dia</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="dateFormatted" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorTotal)"
                strokeWidth={2}
                name="Disparados"
              />
              <Area
                type="monotone"
                dataKey="converted"
                stroke="hsl(var(--success))"
                fillOpacity={1}
                fill="url(#colorConverted)"
                strokeWidth={2}
                name="Convertidos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
