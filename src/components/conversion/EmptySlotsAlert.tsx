import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, TrendingUp, ArrowRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { useGrowthOpportunity } from "@/hooks/useGrowthOpportunity";
import { formatCurrency, getRecoveryEstimate } from "@/utils/growthOpportunityCalculator";
import { Skeleton } from "@/components/ui/skeleton";

export const EmptySlotsAlert = () => {
  const navigate = useNavigate();
  const { isStart, loading: planLoading } = usePlanValidation();
  const { opportunity, metrics, isLoading } = useGrowthOpportunity();

  // Não mostrar para usuários Growth
  if (planLoading || !isStart) return null;
  
  if (isLoading) {
    return (
      <Card className="border-alert-slots/20 bg-alert-slots/5">
        <CardContent className="p-4">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // P1 FIX: Só mostrar se tiver 5+ horários vazios E dados válidos
  if (!metrics || !opportunity || metrics.emptySlotsLast30Days < 5) return null;
  if (metrics.avgTicket <= 0 || opportunity.missedRevenueFromEmptySlots <= 0) return null;

  const potentialRecovery = getRecoveryEstimate('emptySlots', opportunity.missedRevenueFromEmptySlots);

  return (
    <Card className="border-alert-slots/30 bg-gradient-to-r from-alert-slots/10 via-alert-slots/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-alert-slots/20">
            <Clock className="h-6 w-6 text-alert-slots" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-alert-slots" />
              <span className="font-bold text-alert-slots">
                Você teve {metrics.emptySlotsLast30Days} horários vazios nos últimos 30 dias
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Isso pode significar <span className="text-destructive font-semibold">{formatCurrency(opportunity.missedRevenueFromEmptySlots)}</span> que deixaram de entrar.
              <span className="text-opportunity font-medium ml-1">
                O Growth pode recuperar até {formatCurrency(potentialRecovery)}.
              </span>
            </p>
          </div>

          <Button
            onClick={() => navigate('/planos')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
            size="sm"
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Preencher agenda
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};