import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, Users, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLostRevenueSummary } from "@/hooks/useLostRevenue";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { useGrowthOpportunity } from "@/hooks/useGrowthOpportunity";
import { formatCurrency, getRecoveryEstimate } from "@/utils/growthOpportunityCalculator";

export const LostRevenueAlert = () => {
  const { summary, isLoading } = useLostRevenueSummary();
  const { isStart, loading: planLoading } = usePlanValidation();
  const { opportunity } = useGrowthOpportunity();
  const navigate = useNavigate();

  if (isLoading || planLoading) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-4">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (summary.total_lost === 0) {
    return null;
  }

  // Calcular potencial de recuperação
  const totalLostFromNoShows = opportunity?.missedRevenueFromNoShows || 0;
  const totalLostFromCancellations = opportunity?.missedRevenueFromCancellations || 0;
  const potentialRecovery = getRecoveryEstimate('noShows', totalLostFromNoShows + totalLostFromCancellations);

  // Mensagem diferente para Start vs Growth
  const handleClick = () => {
    if (isStart) {
      navigate('/planos');
    } else {
      navigate('/growth-engine');
    }
  };

  return (
    <Card 
      className="border-destructive/30 bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent cursor-pointer hover:shadow-lg hover:border-destructive/50 transition-all"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-destructive/20 animate-pulse">
            <TrendingDown className="h-6 w-6 text-destructive" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="font-bold text-destructive text-lg">
                Você perdeu {formatCurrency(summary.total_lost)} este mês
              </span>
            </div>
            
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {summary.no_show_count > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {summary.no_show_count} falta(s)
                </span>
              )}
              {summary.late_cancel_count > 0 && (
                <span>• {summary.late_cancel_count} cancelamento(s) tardio(s)</span>
              )}
              {summary.cancelled_count > 0 && (
                <span>• {summary.cancelled_count} cancelamento(s)</span>
              )}
            </div>

            {/* Mensagem persuasiva com valor para usuários Start */}
            {isStart && potentialRecovery > 0 && (
              <p className="text-xs mt-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  O Growth pode recuperar até {formatCurrency(potentialRecovery)}
                </span>
                <span className="text-muted-foreground ml-1">
                  com lembretes automáticos.
                </span>
              </p>
            )}
          </div>

          {isStart ? (
            <Button
              size="sm"
              className="bg-[#C9B27C] hover:bg-[#C9B27C]/90 text-black shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/planos');
              }}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Parar de perder
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <div className="text-right">
              <span className="text-xs text-primary font-medium">Ver detalhes →</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
