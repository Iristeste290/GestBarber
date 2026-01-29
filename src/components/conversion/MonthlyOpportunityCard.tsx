import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { useGrowthOpportunity } from "@/hooks/useGrowthOpportunity";
import { formatCurrency } from "@/utils/growthOpportunityCalculator";
import { Skeleton } from "@/components/ui/skeleton";

export const MonthlyOpportunityCard = () => {
  const navigate = useNavigate();
  const { isStart, loading: planLoading } = usePlanValidation();
  const { opportunity, metrics, isLoading } = useGrowthOpportunity();

  // Só mostrar para usuários Start
  if (planLoading || !isStart) return null;

  if (isLoading) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // P1 FIX: Só mostrar se houver oportunidade significativa (> R$ 100) e dados válidos
  if (!opportunity || !metrics || opportunity.potentialRecoveryWithGrowth < 100) return null;
  
  // Verificar se há dados reais (não apenas zeros)
  const hasRealData = metrics.avgTicket > 0 && (
    metrics.noShowsLast30Days > 0 || 
    metrics.cancellationsLast30Days > 0 || 
    metrics.emptySlotsLast30Days > 0 || 
    metrics.inactiveClientsCount > 0
  );
  
  if (!hasRealData) return null;

  const hasNoShows = metrics?.noShowsLast30Days && metrics.noShowsLast30Days > 0;
  const hasEmptySlots = metrics?.emptySlotsLast30Days && metrics.emptySlotsLast30Days > 0;
  const hasInactiveClients = metrics?.inactiveClientsCount && metrics.inactiveClientsCount > 0;

  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-background overflow-hidden relative">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <AlertTriangle className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-bold">
            Você pode estar deixando dinheiro na mesa
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Com base na sua movimentação dos últimos 30 dias, você pode ter deixado de ganhar até:
        </p>

        {/* Valor principal destacado */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-opportunity/20 to-opportunity/5 border border-opportunity/30">
          <DollarSign className="h-8 w-8 text-opportunity" />
          <div>
            <span className="text-3xl font-bold text-opportunity">
              {formatCurrency(opportunity.potentialRecoveryWithGrowth)}
            </span>
            <p className="text-xs text-muted-foreground">
              estimativa de recuperação mensal
            </p>
          </div>
        </div>

        {/* Breakdown por categoria */}
        <div className="space-y-2 text-sm">
          {hasNoShows && opportunity.missedRevenueFromNoShows > 0 && (
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Faltas e cancelamentos</span>
              <span className="text-destructive font-medium">
                -{formatCurrency(opportunity.missedRevenueFromNoShows + opportunity.missedRevenueFromCancellations)}
              </span>
            </div>
          )}
          {hasEmptySlots && opportunity.missedRevenueFromEmptySlots > 0 && (
            <div className="flex justify-between items-center text-muted-foreground">
              <span>{metrics?.emptySlotsLast30Days} horários vazios</span>
              <span className="text-destructive font-medium">
                -{formatCurrency(opportunity.missedRevenueFromEmptySlots)}
              </span>
            </div>
          )}
          {hasInactiveClients && opportunity.missedRevenueFromInactiveClients > 0 && (
            <div className="flex justify-between items-center text-muted-foreground">
              <span>{metrics?.inactiveClientsCount} clientes inativos</span>
              <span className="text-destructive font-medium">
                -{formatCurrency(opportunity.missedRevenueFromInactiveClients)}
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-3">
            O plano Growth ativa automações que ajudam a recuperar esse valor.
          </p>
          <Button
            onClick={() => navigate('/planos')}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Desbloquear Growth Engine
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};