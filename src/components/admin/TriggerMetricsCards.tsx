import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users } from "lucide-react";
import type { TriggerAnalytics } from "@/hooks/useUpgradeTriggerAnalytics";

interface TriggerMetricsCardsProps {
  data: TriggerAnalytics;
}

export const TriggerMetricsCards = ({ data }: TriggerMetricsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Média de Dinheiro Perdido
          </CardTitle>
          <div className="p-2 bg-destructive/10 rounded-full">
            <DollarSign className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            R$ {data.avgLostMoney.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Valor médio exibido nos gatilhos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Média de Clientes Perdidos
          </CardTitle>
          <div className="p-2 bg-warning/10 rounded-full">
            <Users className="h-4 w-4 text-warning" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.avgLostClients.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Clientes médios exibidos nos gatilhos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
