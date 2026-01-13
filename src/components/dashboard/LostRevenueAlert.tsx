import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, Users } from "lucide-react";
import { useLostRevenueSummary } from "@/hooks/useLostRevenue";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export const LostRevenueAlert = () => {
  const { summary, isLoading } = useLostRevenueSummary();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-4">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (summary.total_lost === 0) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card 
      className="border-destructive/30 bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent cursor-pointer hover:shadow-lg hover:border-destructive/50 transition-all"
      onClick={() => navigate('/growth-engine')}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-destructive/20 animate-pulse">
            <TrendingDown className="h-6 w-6 text-destructive" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="font-bold text-destructive text-lg">
                Você perdeu {formatCurrency(summary.total_lost)} este mês
              </span>
            </div>
            
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {summary.no_show_count > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {summary.no_show_count} falta(s)
                </span>
              )}
              {summary.late_cancel_count > 0 && (
                <span>• {summary.late_cancel_count} cancelamento(s) tardio(s)</span>
              )}
              {summary.cancelled_count > 0 && (
                <span>• {summary.cancelled_count} cancelamento(s)</span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-primary font-medium">Ver detalhes →</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
