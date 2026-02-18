import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp, Percent } from "lucide-react";
import { Cell, Pie, PieChart, Tooltip, Legend } from "recharts";

interface ExpensesSummaryProps {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: string;
  expensesByCategory: Record<string, number>;
}

const COLORS = [
  'hsl(142 76% 46%)',
  'hsl(217 91% 60%)',
  'hsl(38 92% 55%)',
  'hsl(280 68% 60%)',
  'hsl(0 84% 60%)',
  'hsl(186 74% 50%)',
];

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

  const formatCardValue = (value: number) => {
    const absValue = Math.abs(value);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absValue);
  };

  const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name: CATEGORY_LABELS[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.35;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '11px', fontWeight: 500 }}
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4 px-2">
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
                <p className="text-xs font-medium text-muted-foreground mb-1">Receita</p>
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
                <p className="text-xs font-medium text-muted-foreground mb-1">Despesas</p>
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
                <p className="text-xs font-medium text-muted-foreground mb-1">Lucro</p>
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
                <p className="text-xs font-medium text-muted-foreground mb-1">Margem</p>
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
          <CardContent className="p-0 pb-2">
            {/* Container scrollável horizontalmente no mobile */}
            <div
              className="overflow-x-auto"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div style={{ minWidth: '380px' }}>
                <PieChart width={380} height={300} style={{ margin: '0 auto' }}>
                  <Pie
                    data={chartData}
                    cx={190}
                    cy="44%"
                    labelLine={true}
                    label={renderCustomLabel}
                    outerRadius={85}
                    innerRadius={40}
                    dataKey="value"
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(Number(value)), name]}
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      padding: '10px 14px',
                    }}
                    labelStyle={{
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '13px',
                      marginBottom: '2px',
                    }}
                    itemStyle={{
                      color: '#e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend content={renderLegend} />
                </PieChart>
              </div>
            </div>
            {/* Dica de scroll apenas no mobile */}
            <p className="text-center text-[10px] text-muted-foreground/50 pb-2 sm:hidden">
              ← deslize para ver →
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
};
