import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign,
  Zap,
  ArrowUpRight
} from "lucide-react";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { useEngagementMetrics } from "@/hooks/useEngagementMetrics";
import { formatCurrency } from "@/utils/growthOpportunityCalculator";
import { Skeleton } from "@/components/ui/skeleton";

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: boolean;
}

const StatItem = ({ icon, label, value, subValue, trend, highlight }: StatItemProps) => (
  <div className={`p-3 rounded-lg ${highlight ? 'bg-opportunity/10 border border-opportunity/20' : 'bg-muted/50'}`}>
    <div className="flex items-start justify-between">
      <div className="p-1.5 rounded-md bg-background/50">
        {icon}
      </div>
      {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-opportunity" />}
    </div>
    <p className={`text-xl font-bold mt-2 ${highlight ? 'text-opportunity' : ''}`}>
      {value}
    </p>
    <p className="text-xs text-muted-foreground">{label}</p>
    {subValue && (
      <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>
    )}
  </div>
);

export const EngagementStatsCard = () => {
  const { isGrowth, loading: planLoading } = usePlanValidation();
  const { data: metrics, isLoading } = useEngagementMetrics();

  // Só mostrar para usuários Growth (mostra o que eles estão ganhando)
  if (planLoading || !isGrowth) return null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  // P1 FIX: Validar dados antes de exibir
  if (!metrics) return null;
  if (metrics.avgTicket <= 0) return null;

  // Estimativas de recuperação com Growth (para mostrar valor)
  const recoveredFromReminders = Math.round(metrics.weeklyNoShows * metrics.avgTicket * 0.6);
  const recoveredFromReactivation = metrics.reactivatedClientsThisMonth * metrics.avgTicket;

  return (
    <Card className="border-opportunity/20 bg-gradient-to-br from-opportunity/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-opportunity" />
            Estatísticas do seu crescimento
          </CardTitle>
          <span className="text-xs bg-opportunity/20 text-opportunity px-2 py-1 rounded-full font-medium">
            Growth Ativo
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatItem
            icon={<Users className="h-4 w-4 text-opportunity" />}
            label="Clientes reativados"
            value={metrics.reactivatedClientsThisMonth}
            subValue="voltaram este mês"
            trend="up"
          />
          <StatItem
            icon={<Clock className="h-4 w-4 text-opportunity" />}
            label="Horários preenchidos"
            value={`${100 - (metrics.weeklyEmptySlots > 0 ? Math.round((metrics.weeklyEmptySlots / 40) * 100) : 0)}%`}
            subValue="da sua agenda"
            trend="up"
          />
          <StatItem
            icon={<DollarSign className="h-4 w-4 text-opportunity" />}
            label="Receita recuperada"
            value={formatCurrency(recoveredFromReminders + recoveredFromReactivation)}
            subValue="este mês"
            trend="up"
            highlight
          />
          <StatItem
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            label="Ticket médio"
            value={formatCurrency(metrics.avgTicket)}
            subValue="por atendimento"
          />
        </div>

        <div className="p-3 rounded-lg bg-opportunity/10 border border-opportunity/20">
          <p className="text-xs text-center text-opportunity">
            ✨ Suas automações estão protegendo seu faturamento automaticamente
          </p>
        </div>
      </CardContent>
    </Card>
  );
};