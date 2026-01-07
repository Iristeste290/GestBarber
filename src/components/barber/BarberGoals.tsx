import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, DollarSign, Package } from "lucide-react";

interface BarberGoalsProps {
  goals: any;
}

export const BarberGoals = ({ goals }: BarberGoalsProps) => {
  if (!goals) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Nenhuma meta definida para esta semana</p>
        </CardContent>
      </Card>
    );
  }

  const haircutsProgress = (goals.current_haircuts / goals.target_haircuts) * 100;
  const ticketProgress = (goals.current_avg_ticket / goals.target_avg_ticket) * 100;
  const salesProgress = (goals.current_product_sales / goals.target_product_sales) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas da Semana
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Cortes</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {goals.current_haircuts} / {goals.target_haircuts}
            </span>
          </div>
          <Progress value={Math.min(haircutsProgress, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {haircutsProgress >= 100 ? '🎉 Meta batida!' : `Faltam ${goals.target_haircuts - goals.current_haircuts} cortes`}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Ticket Médio</span>
            </div>
            <span className="text-sm text-muted-foreground">
              R$ {goals.current_avg_ticket.toFixed(2)} / R$ {goals.target_avg_ticket.toFixed(2)}
            </span>
          </div>
          <Progress value={Math.min(ticketProgress, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {ticketProgress >= 100 ? '🎉 Meta batida!' : `Faltam R$ ${(goals.target_avg_ticket - goals.current_avg_ticket).toFixed(2)}`}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Vendas de Produtos</span>
            </div>
            <span className="text-sm text-muted-foreground">
              R$ {goals.current_product_sales.toFixed(2)} / R$ {goals.target_product_sales.toFixed(2)}
            </span>
          </div>
          <Progress value={Math.min(salesProgress, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {salesProgress >= 100 ? '🎉 Meta batida!' : `Faltam R$ ${(goals.target_product_sales - goals.current_product_sales).toFixed(2)}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
