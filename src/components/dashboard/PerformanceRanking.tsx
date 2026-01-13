import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, RefreshCw } from "lucide-react";
import { useBarbershopPerformance, useCalculatePerformance } from "@/hooks/useBarbershopPerformance";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const PerformanceRanking = () => {
  const { data: performance, isLoading } = useBarbershopPerformance();
  const { mutate: calculatePerformance, isPending } = useCalculatePerformance();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getPercentileLabel = (percentile: number) => {
    if (percentile >= 90) return "Top 10%";
    if (percentile >= 75) return "Top 25%";
    if (percentile >= 50) return "Top 50%";
    return `Top ${100 - percentile}%`;
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return "text-primary"; // Gold for top performers
    if (percentile >= 75) return "text-success";
    if (percentile >= 50) return "text-foreground";
    return "text-muted-foreground";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="border-primary/20 hover:shadow-gold transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="bg-gradient-gold bg-clip-text text-transparent">Sua Performance</span>
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => calculatePerformance()}
          disabled={isPending}
          className="hover:bg-primary/10"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {performance ? (
          <div className="space-y-4">
            {/* Percentile Badge */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-gold-subtle border border-primary/20">
              <div>
                <p className="text-sm text-muted-foreground">Ranking Regional</p>
                <p className={`text-2xl font-bold ${getPercentileColor(performance.performance_percentile)}`}>
                  {getPercentileLabel(performance.performance_percentile)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-2xl font-bold text-primary">{performance.performance_score}</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Faturamento</p>
                <p className="font-semibold">{formatCurrency(performance.total_revenue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                <p className="font-semibold">{formatCurrency(performance.avg_ticket)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Taxa de Ocupação</p>
                <div className="flex items-center gap-2">
                  <Progress value={performance.occupancy_rate} className="h-2 flex-1" />
                  <span className="text-sm font-medium">{performance.occupancy_rate}%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Retenção</p>
                <div className="flex items-center gap-2">
                  <Progress value={performance.retention_rate} className="h-2 flex-1" />
                  <span className="text-sm font-medium">{performance.retention_rate}%</span>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <p className="text-xs text-muted-foreground text-center">
              Atualizado em {format(new Date(performance.calculated_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground mb-3">
              Calcule sua performance para ver seu ranking
            </p>
            <Button onClick={() => calculatePerformance()} disabled={isPending}>
              {isPending ? 'Calculando...' : 'Calcular Performance'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
