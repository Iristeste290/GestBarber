import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp, Percent } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface ExpensesSummaryProps {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: string;
  expensesByCategory: Record<string, number>;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const CATEGORY_LABELS: Record<string, string> = {
  aluguel: "Aluguel",
  energia: "Energia",
  agua: "Água",
  produtos: "Produtos",
  salarios: "Salários",
  outros: "Outros",
  marketing: "Marketing",
  manutencao: "Manutenção",
  internet: "Internet",
  telefone: "Telefone",
};

export const ExpensesSummary = ({
  totalRevenue,
  totalExpenses,
  netProfit,
  profitMargin,
  expensesByCategory,
}: ExpensesSummaryProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Format currency for display in cards - always show absolute value with proper sign
  const formatCardValue = (value: number, showSign: boolean = false) => {
    const absValue = Math.abs(value);
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absValue);
    
    if (showSign && value < 0) {
      return `- ${formatted}`;
    }
    return formatted;
  };

  const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name: CATEGORY_LABELS[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Custom label renderer for better visibility
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.35;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show labels for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
        style={{ fontSize: '12px', fontWeight: 500 }}
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom legend renderer
  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-medium text-foreground">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Receita Total */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Receita
                </p>
                <p className="text-base md:text-xl font-bold text-green-600 tabular-nums tracking-tight whitespace-nowrap">
                  {formatCardValue(totalRevenue)}
                </p>
              </div>
              <div className="flex-shrink-0 p-1.5 bg-green-500/10 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Despesas
                </p>
                <p className="text-base md:text-xl font-bold text-red-600 tabular-nums tracking-tight whitespace-nowrap">
                  {formatCardValue(totalExpenses)}
                </p>
              </div>
              <div className="flex-shrink-0 p-1.5 bg-red-500/10 rounded-full">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lucro Líquido */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Lucro
                </p>
                <p className={`text-base md:text-xl font-bold tabular-nums tracking-tight whitespace-nowrap ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit < 0 ? '-' : ''}{formatCardValue(Math.abs(netProfit))}
                </p>
              </div>
              <div className={`flex-shrink-0 p-1.5 rounded-full ${netProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <DollarSign className={`h-4 w-4 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Margem */}
        <Card className="overflow-hidden">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Margem
                </p>
                <p className={`text-base md:text-xl font-bold tabular-nums tracking-tight whitespace-nowrap ${parseFloat(profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(profitMargin) < 0 ? '-' : ''}{Math.abs(parseFloat(profitMargin)).toFixed(1)}%
                </p>
              </div>
              <div className={`flex-shrink-0 p-1.5 rounded-full ${parseFloat(profitMargin) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <Percent className={`h-4 w-4 ${parseFloat(profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={renderCustomLabel}
                  outerRadius={85}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      className="drop-shadow-sm"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  labelStyle={{
                    color: 'hsl(var(--foreground))',
                    fontWeight: 600,
                  }}
                />
                <Legend content={renderLegend} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
};
