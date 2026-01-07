import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, DollarSign, TrendingUp } from "lucide-react";

interface PaymentStatsProps {
  pendingAmount: number;
  todayAmount: number;
  conversionRate: number;
  pendingCount: number;
  todayCount: number;
}

export const PaymentStats = ({
  pendingAmount,
  todayAmount,
  conversionRate,
  pendingCount,
  todayCount,
}: PaymentStatsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
          <p className="text-xs text-muted-foreground">
            {pendingCount} {pendingCount === 1 ? "pagamento aguardando" : "pagamentos aguardando"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recebido Hoje</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(todayAmount)}</div>
          <p className="text-xs text-muted-foreground">
            {todayCount} {todayCount === 1 ? "pagamento confirmado" : "pagamentos confirmados"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">Pagamentos concluídos</p>
        </CardContent>
      </Card>
    </div>
  );
};
