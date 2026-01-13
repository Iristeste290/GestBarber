import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, MessageCircle, Users, X } from "lucide-react";
import { MoneyLostAlert as MoneyLostAlertType, useGrowthEngine } from "@/hooks/useGrowthEngine";
import { useNavigate } from "react-router-dom";

interface MoneyLostAlertProps {
  alert: MoneyLostAlertType;
}

export const MoneyLostAlert = ({ alert }: MoneyLostAlertProps) => {
  const { dismissAlert } = useGrowthEngine();
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (!alert.is_critical && alert.empty_slots_count <= 2 && alert.cancellations_count <= 1) {
    return null;
  }

  return (
    <Alert variant="destructive" className="relative border-red-200 bg-red-50 dark:bg-red-950/20">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">
        ⚠️ Sua barbearia está perdendo dinheiro hoje!
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex flex-wrap gap-4 mb-4">
          {alert.empty_slots_count > 0 && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span><strong>{alert.empty_slots_count}</strong> horários vazios</span>
            </div>
          )}
          {alert.cancellations_count > 0 && (
            <div className="flex items-center gap-2">
              <X className="h-4 w-4" />
              <span><strong>{alert.cancellations_count}</strong> cancelamentos</span>
            </div>
          )}
          {alert.no_shows_count > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span><strong>{alert.no_shows_count}</strong> faltas</span>
            </div>
          )}
          <div className="font-semibold text-red-700 dark:text-red-400">
            Perda estimada: {formatCurrency(alert.estimated_loss)}
          </div>
        </div>

        <p className="text-sm mb-4">
          {alert.cancel_rate > 30 
            ? `Taxa de cancelamento está em ${alert.cancel_rate.toFixed(0)}% - muito alta!`
            : "Quer agir agora para recuperar esses horários?"}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="gap-2"
            onClick={() => navigate("/agenda")}
          >
            <Calendar className="h-4 w-4" />
            Ver horários
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Enviar mensagens
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Ver clientes sumidos
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => dismissAlert.mutate(alert.id)}
          >
            Dispensar
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
