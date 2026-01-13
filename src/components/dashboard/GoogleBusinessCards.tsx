import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Phone, Navigation, Globe, Star, MessageSquare, ExternalLink, AlertCircle, Settings } from "lucide-react";
import { useGoogleBusinessMetrics, useGoogleBusinessConnection } from "@/hooks/useGoogleBusiness";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";

export const GoogleBusinessCards = () => {
  const { data: metrics, isLoading: metricsLoading } = useGoogleBusinessMetrics();
  const { data: connection, isLoading: connectionLoading } = useGoogleBusinessConnection();
  const navigate = useNavigate();

  const isLoading = metricsLoading || connectionLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // If not connected, show connection prompt
  if (!connection?.is_connected) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <div className="p-4 rounded-full bg-primary/10 shrink-0">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="font-semibold text-lg">Visibilidade no Google</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Conecte seu Google Business para ver quantas pessoas encontram sua barbearia, ligam, pedem rota e clicam no site.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/perfil')}
              className="shrink-0"
            >
              <Settings className="mr-2 h-4 w-4" />
              Conectar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const googleBusinessUrl = connection?.business_id 
    ? `https://business.google.com/reviews?id=${connection.business_id}`
    : 'https://business.google.com';

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
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {connection.location_name}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.open(googleBusinessUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasMetrics ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <p>Sincronizando dados do Google Business...</p>
            <p className="text-xs mt-1">As métricas aparecerão em breve</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Views */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Viram você</span>
              </div>
              <p className="text-2xl font-bold">{metrics.views_count?.toLocaleString() || 0}</p>
            </div>

            {/* Calls */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Ligaram</span>
              </div>
              <p className="text-2xl font-bold">{metrics.phone_calls?.toLocaleString() || 0}</p>
            </div>

            {/* Directions */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">Pediram rota</span>
              </div>
              <p className="text-2xl font-bold">{metrics.direction_requests?.toLocaleString() || 0}</p>
            </div>

            {/* Website Clicks */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Clicaram no site</span>
              </div>
              <p className="text-2xl font-bold">{metrics.website_clicks?.toLocaleString() || 0}</p>
            </div>
          </div>
        )}

        {/* Reviews section */}
        {metrics && metrics.average_rating > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${
                        i < Math.round(metrics.average_rating) 
                          ? 'text-yellow-500 fill-yellow-500' 
                          : 'text-muted-foreground/30'
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{metrics.average_rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({metrics.reviews_count} avaliações)
                </span>
              </div>
              
              {(metrics.unanswered_reviews || 0) > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(googleBusinessUrl, '_blank')}
                  className="gap-1"
                >
                  <AlertCircle className="h-3 w-3 text-orange-500" />
                  {metrics.unanswered_reviews} para responder
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
