import { Badge } from "@/components/ui/badge";
import { Shield, Zap, TrendingUp } from "lucide-react";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { useGrowthOpportunity } from "@/hooks/useGrowthOpportunity";
import { formatCurrency } from "@/utils/growthOpportunityCalculator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ChurnPreventionBadge = () => {
  const { isGrowth, loading } = usePlanValidation();
  const { opportunity } = useGrowthOpportunity();

  if (loading || !isGrowth) return null;

  // P1 FIX: Mostrar quanto o usuário está "protegido" por ter Growth, com validação
  const protectedValue = opportunity?.potentialRecoveryWithGrowth || 0;

  // Validar dados antes de exibir
  if (protectedValue < 50) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="bg-opportunity/10 text-opportunity border-opportunity/30 cursor-help animate-pulse"
          >
            <Shield className="h-3 w-3 mr-1" />
            Proteção contra perdas ativa
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-opportunity/20">
                <Zap className="h-4 w-4 text-opportunity" />
              </div>
              <span className="font-bold">Growth Engine Ativo</span>
            </div>
            
            <div className="p-2 rounded-lg bg-opportunity/10">
              <p className="text-sm font-medium text-opportunity mb-1">
                Protegendo até {formatCurrency(protectedValue)}/mês
              </p>
              <p className="text-xs text-muted-foreground">
                em receita que poderia ser perdida com faltas e cancelamentos
              </p>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="h-3 w-3 text-opportunity" />
                <span>Lembretes automáticos reduzem faltas em até 60%</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Shield className="h-3 w-3 text-opportunity" />
                <span>Reativação automática de clientes inativos</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};