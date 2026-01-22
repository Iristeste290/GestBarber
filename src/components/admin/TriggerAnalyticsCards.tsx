import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, XCircle, Zap } from "lucide-react";
import type { TriggerAnalytics } from "@/hooks/useUpgradeTriggerAnalytics";

interface TriggerAnalyticsCardsProps {
  data: TriggerAnalytics;
}

export const TriggerAnalyticsCards = ({ data }: TriggerAnalyticsCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Gatilhos
          </CardTitle>
          <div className="p-2 bg-primary/10 rounded-full">
            <Zap className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalTriggers}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Disparados no período
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Conversões
          </CardTitle>
          <div className="p-2 bg-success/10 rounded-full">
            <Target className="h-4 w-4 text-success" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{data.totalConverted}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Upgrades realizados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taxa de Conversão
          </CardTitle>
          <div className="p-2 bg-accent/10 rounded-full">
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.overallConversionRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Gatilho → Upgrade
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Dispensados
          </CardTitle>
          <div className="p-2 bg-destructive/10 rounded-full">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">
            {data.totalDismissed}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Fechados sem conversão
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
