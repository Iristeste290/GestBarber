import { useGoogleBusinessConnection, useGoogleBusinessMetrics } from "@/hooks/useGoogleBusiness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Eye, 
  Phone, 
  Navigation, 
  Globe, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Settings,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  previousValue?: number;
  color: string;
}

const MetricCard = ({ icon, label, value, previousValue, color }: MetricCardProps) => {
  const trend = previousValue !== undefined 
    ? value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral'
    : 'neutral';

  const percentChange = previousValue && previousValue > 0
    ? Math.round(((value - previousValue) / previousValue) * 100)
    : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{value.toLocaleString()}</span>
          {percentChange !== 0 && (
            <span className={`text-xs flex items-center ${
              trend === 'up' ? 'text-green-500' : 
              trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-0.5" /> : 
               trend === 'down' ? <TrendingDown className="h-3 w-3 mr-0.5" /> : 
               <Minus className="h-3 w-3 mr-0.5" />}
              {Math.abs(percentChange)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const GoogleVisibilityCard = () => {
  const { data: connection, isLoading: connectionLoading } = useGoogleBusinessConnection();
  const { data: metrics, isLoading: metricsLoading } = useGoogleBusinessMetrics();

  if (connectionLoading || metricsLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Not connected state
  if (!connection?.is_connected) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Visibilidade no Google
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Conecte seu Google Business para ver quantas pessoas encontram sua barbearia
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/perfil">
                <Settings className="mr-2 h-4 w-4" />
                Conectar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connected state with metrics
  const hasMetrics = metrics && (
    metrics.views_count > 0 || 
    metrics.phone_calls > 0 || 
    metrics.direction_requests > 0 || 
    metrics.website_clicks > 0
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Visibilidade no Google
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Últimos 7 dias
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {!hasMetrics ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <p>Dados sendo sincronizados...</p>
            <p className="text-xs mt-1">As métricas aparecerão em breve</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={<Eye className="h-4 w-4 text-blue-500" />}
              label="Viram sua barbearia"
              value={metrics.views_count}
              color="bg-blue-500/10"
            />
            <MetricCard
              icon={<Phone className="h-4 w-4 text-green-500" />}
              label="Ligaram"
              value={metrics.phone_calls}
              color="bg-green-500/10"
            />
            <MetricCard
              icon={<Navigation className="h-4 w-4 text-orange-500" />}
              label="Pediram rota"
              value={metrics.direction_requests}
              color="bg-orange-500/10"
            />
            <MetricCard
              icon={<Globe className="h-4 w-4 text-purple-500" />}
              label="Clicaram no site"
              value={metrics.website_clicks}
              color="bg-purple-500/10"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
