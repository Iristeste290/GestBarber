import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Target,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { useEngagementMetrics } from "@/hooks/useEngagementMetrics";
import { formatCurrency } from "@/utils/growthOpportunityCalculator";
import { Skeleton } from "@/components/ui/skeleton";

export const WeeklyProgressCard = () => {
  const navigate = useNavigate();
  const { isStart, loading: planLoading } = usePlanValidation();
  const { data: metrics, isLoading } = useEngagementMetrics();

  // Só mostrar para usuários Start
  if (planLoading || !isStart) return null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  // P1 FIX: Validar dados antes de exibir
  if (!metrics) return null;
  if (metrics.avgTicket <= 0) return null;

  // Meta mensal estimada (4x a média semanal ideal)
  const monthlyGoal = metrics.avgTicket * 40; // ~40 atendimentos/mês como meta
  const progressPercentage = Math.min((metrics.revenueThisMonth / monthlyGoal) * 100, 100);

  // Calcular quanto poderia ganhar com Growth
  const missedOpportunity = metrics.potentialMonthlyRecovery;

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Seu progresso mensal
          </CardTitle>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {metrics.appointmentsThisMonth}/{Math.round(monthlyGoal / metrics.avgTicket)} atendimentos
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Faturamento atual</span>
            <span className="font-bold text-lg">{formatCurrency(metrics.revenueThisMonth)}</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Meta: {formatCurrency(monthlyGoal)}</span>
            <span className="font-medium text-primary">{Math.round(progressPercentage)}% atingido</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{metrics.weeklyOccupancyRate}%</p>
            <p className="text-xs text-muted-foreground">Ocupação</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-opportunity/10">
            <Users className="h-4 w-4 mx-auto mb-1 text-opportunity" />
            <p className="text-lg font-bold text-opportunity">{metrics.reactivatedClientsThisMonth}</p>
            <p className="text-xs text-muted-foreground">Reativados</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-destructive/10">
            <DollarSign className="h-4 w-4 mx-auto mb-1 text-destructive" />
            <p className="text-lg font-bold text-destructive">
              {metrics.weeklyNoShows + metrics.weeklyCancellations}
            </p>
            <p className="text-xs text-muted-foreground">Faltas</p>
          </div>
        </div>

        {/* Oportunidade perdida - Destaque principal */}
        {missedOpportunity > 100 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Com o Growth, você poderia ter faturado
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-opportunity">
                    +{formatCurrency(missedOpportunity)}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => navigate('/planos')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Desbloquear Growth
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};