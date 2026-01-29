import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserX, TrendingUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { useGrowthOpportunity } from "@/hooks/useGrowthOpportunity";
import { formatCurrency, getRecoveryEstimate } from "@/utils/growthOpportunityCalculator";
import { Skeleton } from "@/components/ui/skeleton";

export const InactiveClientsAlert = () => {
  const navigate = useNavigate();
  const { isStart, loading: planLoading } = usePlanValidation();
  const { opportunity, metrics, isLoading } = useGrowthOpportunity();

  // Não mostrar para usuários Growth
  if (planLoading || !isStart) return null;
  
  if (isLoading) {
    return (
      <Card className="border-alert-inactive/20 bg-alert-inactive/5">
        <CardContent className="p-4">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  // P1 FIX: Só mostrar se tiver 3+ clientes inativos E ticket médio válido
  if (!metrics || !opportunity || metrics.inactiveClientsCount < 3) return null;
  if (metrics.avgTicket <= 0 || opportunity.missedRevenueFromInactiveClients <= 0) return null;

  const potentialRecovery = getRecoveryEstimate('inactiveClients', opportunity.missedRevenueFromInactiveClients);

  return (
    <Card className="border-alert-inactive/30 bg-gradient-to-r from-alert-inactive/10 via-alert-inactive/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-alert-inactive/20">
            <UserX className="h-6 w-6 text-alert-inactive" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-alert-inactive" />
              <span className="font-bold text-alert-inactive">
                Você tem {metrics.inactiveClientsCount} clientes inativos
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Isso pode representar <span className="text-destructive font-semibold">{formatCurrency(opportunity.missedRevenueFromInactiveClients)}</span> parados.
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
            Reativar clientes
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};