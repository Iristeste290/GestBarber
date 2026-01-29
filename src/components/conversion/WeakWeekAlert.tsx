import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingDown, Calendar, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { useEngagementMetrics } from "@/hooks/useEngagementMetrics";
import { formatCurrency } from "@/utils/growthOpportunityCalculator";
import { Skeleton } from "@/components/ui/skeleton";

export const WeakWeekAlert = () => {
  const navigate = useNavigate();
  const { isStart, loading: planLoading } = usePlanValidation();
  const { data: metrics, isLoading } = useEngagementMetrics();

  // Só mostrar para usuários Start
  if (planLoading || !isStart) return null;

  if (isLoading) {
    return (
      <Card className="border-alert-weak/20 bg-alert-weak/5">
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // P1 FIX: Só mostrar se for semana fraca E houver dados reais
  if (!metrics?.isWeakWeek) return null;

  const weeklyLoss = (metrics?.weeklyEmptySlots || 0) * (metrics?.avgTicket || 50) + 
                     (metrics?.weeklyLostRevenue || 0);

  // Não mostrar se não houver perda real
  if (weeklyLoss < 50) return null;

  return (
    <Card className="border-alert-weak/30 bg-gradient-to-r from-alert-weak/15 via-alert-weak/5 to-transparent overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-alert-weak/20 shrink-0">
            <TrendingDown className="h-6 w-6 text-alert-weak" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-alert-weak flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" />
              Semana fraca na sua agenda
            </h3>
            
            <p className="text-sm text-muted-foreground mb-3">
              Você perdeu aproximadamente{" "}
              <span className="font-bold text-destructive text-base">
                {formatCurrency(weeklyLoss)}
              </span>{" "}
              esta semana devido a {metrics?.weeklyEmptySlots || 0} horários vazios e cancelamentos.
            </p>

            <p className="text-xs text-muted-foreground italic">
              O Growth pode recuperar grande parte desse valor com automações inteligentes.
            </p>
          </div>

          <Button
            onClick={() => navigate('/planos')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Ativar Growth Engine
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};