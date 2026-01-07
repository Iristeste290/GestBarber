import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Scissors, Package } from "lucide-react";

interface BarberCommissionsProps {
  commissions: any;
}

export const BarberCommissions = ({ commissions }: BarberCommissionsProps) => {
  if (!commissions) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Comissão do Mês</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            R$ {commissions.commission.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {commissions.commissionRate}% de R$ {commissions.total.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {commissions.total.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Cortes + Produtos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita de Cortes</CardTitle>
          <Scissors className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {commissions.appointmentsTotal.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Serviços concluídos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas de Produtos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {commissions.salesTotal.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Produtos vendidos
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
