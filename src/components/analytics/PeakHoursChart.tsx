import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Clock } from "lucide-react";
import { formatCurrency } from "@/lib/exportUtils";
import { GrowthFeatureGate } from "@/components/growth/GrowthFeatureGate";

interface PeakHoursChartProps {
  data: Array<{ hour: number; count: number; revenue: number }>;
}

export const PeakHoursChart = ({ data }: PeakHoursChartProps) => {
  const chartData = data.map(item => ({
    hora: `${item.hour}:00`,
    agendamentos: item.count,
    receita: item.revenue,
  }));

  const peakHour = data.reduce((max, item) => 
    item.count > max.count ? item : max, data[0] || { hour: 0, count: 0 });

  const chartContent = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horários de Pico
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Horário mais movimentado: <span className="font-bold text-primary">{peakHour.hour}:00</span> ({peakHour.count} agendamentos)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hora" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: any, name: string) => {
                if (name === 'receita') return formatCurrency(value);
                return value;
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="agendamentos" fill="hsl(var(--primary))" />
            <Bar yAxisId="right" dataKey="receita" fill="hsl(var(--secondary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  return (
    <GrowthFeatureGate 
      featureName="Horários de Pico"
      featureDescription="Visualize seus horários de maior e menor movimento para otimizar sua agenda e maximizar o faturamento."
    >
      {chartContent}
    </GrowthFeatureGate>
  );
};
