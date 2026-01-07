import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/exportUtils";

interface PeriodComparisonProps {
  title: string;
  current: any;
  previous: any;
  growth: number;
}

export const PeriodComparison = ({ title, current, previous, growth }: PeriodComparisonProps) => {
  const isPositive = growth >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant={isPositive ? "default" : "destructive"} className="gap-1">
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {formatPercentage(growth)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Período Anterior</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-muted-foreground/80">
                {formatCurrency(previous.revenue)}
              </p>
              <p className="text-xs text-muted-foreground">
                {previous.appointmentsCount} agendamentos
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <p className="text-sm text-muted-foreground">Período Atual</p>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(current.revenue)}
            </p>
            <p className="text-xs text-muted-foreground">
              {current.appointmentsCount} agendamentos • {current.salesCount} vendas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="text-sm font-bold">{formatCurrency(current.expenses)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Lucro</p>
            <p className="text-sm font-bold text-primary">{formatCurrency(current.profit)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
