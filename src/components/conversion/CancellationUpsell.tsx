import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bell, TrendingUp, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { useGrowthOpportunity } from "@/hooks/useGrowthOpportunity";
import { formatCurrency, getRecoveryEstimate } from "@/utils/growthOpportunityCalculator";

interface CancellationUpsellProps {
  isOpen: boolean;
  onClose: () => void;
  customerName?: string;
}

export const CancellationUpsell = ({
  isOpen,
  onClose,
  customerName,
}: CancellationUpsellProps) => {
  const navigate = useNavigate();
  const { isStart } = usePlanValidation();
  const { opportunity } = useGrowthOpportunity();

  // Não mostrar para Growth
  if (!isStart) {
    if (isOpen) onClose();
    return null;
  }

  const handleUpgrade = () => {
    onClose();
    navigate('/planos');
  };

  const lostFromNoShows = opportunity?.missedRevenueFromNoShows || 0;
  const lostFromCancellations = opportunity?.missedRevenueFromCancellations || 0;
  const totalLost = lostFromNoShows + lostFromCancellations;
  const potentialRecovery = getRecoveryEstimate('noShows', totalLost);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <DialogTitle>Cancelamento de última hora</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {customerName ? (
              <span><strong>{customerName}</strong> cancelou o agendamento.</span>
            ) : (
              <span>Um cliente cancelou o agendamento.</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {totalLost > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <DollarSign className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Cancelamentos e faltas podem ter te feito perder cerca de {formatCurrency(totalLost)} este mês
                </p>
              </div>
            </div>
          )}
          
          <div className="p-4 rounded-lg bg-[#C9B27C]/10 border border-[#C9B27C]/20">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-[#C9B27C] mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Lembretes automáticos do Growth
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  O Growth envia lembretes via WhatsApp 24h antes, reduzindo faltas e cancelamentos.
                </p>
                {potentialRecovery > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">
                    Potencial de recuperação: {formatCurrency(potentialRecovery)}/mês
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button
            onClick={handleUpgrade}
            className="bg-[#C9B27C] hover:bg-[#C9B27C]/90 text-black"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Ativar lembretes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook para usar o upsell de cancelamento
export const useCancellationUpsell = () => {
  const [showUpsell, setShowUpsell] = useState(false);
  const [customerName, setCustomerName] = useState<string | undefined>();
  const { isStart } = usePlanValidation();

  const triggerUpsell = (name?: string) => {
    if (!isStart) return;
    
    // Não mostrar mais de 1x por sessão
    const shown = sessionStorage.getItem('cancellation-upsell-shown');
    if (shown) return;

    setCustomerName(name);
    setShowUpsell(true);
    sessionStorage.setItem('cancellation-upsell-shown', 'true');
  };

  const closeUpsell = () => {
    setShowUpsell(false);
    setCustomerName(undefined);
  };

  return {
    showUpsell,
    customerName,
    triggerUpsell,
    closeUpsell,
  };
};
