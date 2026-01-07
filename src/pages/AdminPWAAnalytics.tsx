import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Download, X, Eye, CheckCircle, Smartphone, Monitor, Apple, Route, Users, Globe } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PWAStats {
  total_shown: number;
  total_installs: number;
  total_dismissed: number;
  install_rate: number;
  dismiss_rate: number;
  by_platform: {
    android: { shown: number; installed: number };
    ios: { shown: number; installed: number };
    desktop: { shown: number; installed: number };
  };
  daily_stats: {
    date: string;
    shown: number;
    installed: number;
    dismissed: number;
  }[];
}

interface RedirectStats {
  total: number;
  pwa_installed: number;
  frequent_visitor: number;
  landing_page: number;
  daily_stats: {
    date: string;
    pwa: number;
    frequent: number;
    landing: number;
  }[];
}

const AdminPWAAnalytics = () => {
  const { isAdmin, loading: authLoading } = useRequireAdmin();
  

  const { data: stats, isLoading } = useQuery({
    queryKey: ['pwa-analytics'],
    queryFn: async (): Promise<PWAStats> => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const { data, error } = await supabase
        .from('pwa_analytics')
        .select('*')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process data
      const events = data || [];
      
      const total_shown = events.filter(e => e.event_type === 'prompt_shown').length;
      const total_installs = events.filter(e => e.event_type === 'install_success').length;
      const total_dismissed = events.filter(e => e.event_type === 'dismissed').length;

      // By platform
      const platforms = ['android', 'ios', 'desktop'] as const;
      const by_platform = platforms.reduce((acc, platform) => {
        acc[platform] = {
          shown: events.filter(e => e.platform === platform && e.event_type === 'prompt_shown').length,
          installed: events.filter(e => e.platform === platform && e.event_type === 'install_success').length,
        };
        return acc;
      }, {} as PWAStats['by_platform']);

      // Daily stats (last 7 days)
      const daily_stats: PWAStats['daily_stats'] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayEvents = events.filter(e => e.created_at?.startsWith(dateStr));
        
        daily_stats.push({
          date: format(date, 'dd/MM', { locale: ptBR }),
          shown: dayEvents.filter(e => e.event_type === 'prompt_shown').length,
          installed: dayEvents.filter(e => e.event_type === 'install_success').length,
          dismissed: dayEvents.filter(e => e.event_type === 'dismissed').length,
        });
      }

      return {
        total_shown,
        total_installs,
        total_dismissed,
        install_rate: total_shown > 0 ? (total_installs / total_shown) * 100 : 0,
        dismiss_rate: total_shown > 0 ? (total_dismissed / total_shown) * 100 : 0,
        by_platform,
        daily_stats,
      };
    },
    enabled: isAdmin,
  });

  const { data: redirectStats, isLoading: redirectLoading } = useQuery({
    queryKey: ['redirect-analytics'],
    queryFn: async (): Promise<RedirectStats> => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const { data, error } = await supabase
        .from('redirect_analytics')
        .select('*')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const events = data || [];
      
      const pwa_installed = events.filter(e => e.redirect_type === 'pwa_installed').length;
      const frequent_visitor = events.filter(e => e.redirect_type === 'frequent_visitor').length;
      const landing_page = events.filter(e => e.redirect_type === 'landing_page').length;

      // Daily stats (last 7 days)
      const daily_stats: RedirectStats['daily_stats'] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayEvents = events.filter(e => e.created_at?.startsWith(dateStr));
        
        daily_stats.push({
          date: format(date, 'dd/MM', { locale: ptBR }),
          pwa: dayEvents.filter(e => e.redirect_type === 'pwa_installed').length,
          frequent: dayEvents.filter(e => e.redirect_type === 'frequent_visitor').length,
          landing: dayEvents.filter(e => e.redirect_type === 'landing_page').length,
        });
      }

      return {
        total: events.length,
        pwa_installed,
        frequent_visitor,
        landing_page,
        daily_stats,
      };
    },
    enabled: isAdmin,
  });

  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
        </div>

        {/* Redirect Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Route className="w-5 h-5" />
              Redirecionamentos
            </CardTitle>
            <CardDescription>Como usuários acessam o app (últimos 30 dias)</CardDescription>
          </CardHeader>
          <CardContent>
            {redirectLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : (
              <div className="space-y-4">
                <RedirectRow
                  icon={<Smartphone className="w-5 h-5 text-primary" />}
                  name="PWA Instalado"
                  count={redirectStats?.pwa_installed || 0}
                  total={redirectStats?.total || 0}
                  description="Usuários com app instalado"
                  color="bg-primary"
                />
                <RedirectRow
                  icon={<Users className="w-5 h-5 text-green-500" />}
                  name="Visitantes Frequentes"
                  count={redirectStats?.frequent_visitor || 0}
                  total={redirectStats?.total || 0}
                  description="5+ visitas ao site"
                  color="bg-green-500"
                />
                <RedirectRow
                  icon={<Globe className="w-5 h-5 text-blue-500" />}
                  name="Landing Page"
                  count={redirectStats?.landing_page || 0}
                  total={redirectStats?.total || 0}
                  description="Novos visitantes"
                  color="bg-blue-500"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Redirect Daily Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Redirecionamentos - Últimos 7 dias</CardTitle>
            <CardDescription>Origem dos acessos por dia</CardDescription>
          </CardHeader>
          <CardContent>
            {redirectLoading ? (
              <Skeleton className="h-40" />
            ) : (
              <div className="space-y-3">
                {redirectStats?.daily_stats.map((day) => {
                  const total = day.pwa + day.frequent + day.landing;
                  return (
                    <div key={day.date} className="flex items-center gap-4">
                      <span className="w-12 text-sm text-muted-foreground font-medium">{day.date}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden flex">
                          {total > 0 ? (
                            <>
                              {day.pwa > 0 && (
                                <div 
                                  className="bg-primary h-full flex items-center justify-center text-xs font-medium text-primary-foreground"
                                  style={{ width: `${(day.pwa / total) * 100}%` }}
                                >
                                  {day.pwa}
                                </div>
                              )}
                              {day.frequent > 0 && (
                                <div 
                                  className="bg-green-500 h-full flex items-center justify-center text-xs font-medium text-white"
                                  style={{ width: `${(day.frequent / total) * 100}%` }}
                                >
                                  {day.frequent}
                                </div>
                              )}
                              {day.landing > 0 && (
                                <div 
                                  className="bg-blue-500 h-full flex items-center justify-center text-xs font-medium text-white"
                                  style={{ width: `${(day.landing / total) * 100}%` }}
                                >
                                  {day.landing}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground px-2 flex items-center">Sem dados</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-primary" />
                    <span>PWA</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span>Frequentes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span>Landing</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics PWA</h1>
          <p className="text-muted-foreground">Estatísticas de instalação do aplicativo</p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Prompts Exibidos"
            value={stats?.total_shown || 0}
            icon={<Eye className="w-5 h-5" />}
            description="Últimos 30 dias"
            isLoading={isLoading}
          />
          <StatCard
            title="Instalações"
            value={stats?.total_installs || 0}
            icon={<CheckCircle className="w-5 h-5" />}
            description={`${stats?.install_rate.toFixed(1) || 0}% taxa de conversão`}
            isLoading={isLoading}
            variant="success"
          />
          <StatCard
            title="Dispensados"
            value={stats?.total_dismissed || 0}
            icon={<X className="w-5 h-5" />}
            description={`${stats?.dismiss_rate.toFixed(1) || 0}% do total`}
            isLoading={isLoading}
            variant="warning"
          />
          <StatCard
            title="Taxa de Conversão"
            value={`${stats?.install_rate.toFixed(1) || 0}%`}
            icon={<Download className="w-5 h-5" />}
            description="Instalações / Exibições"
            isLoading={isLoading}
            variant="primary"
          />
        </div>

        {/* Platform breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Por Plataforma</CardTitle>
            <CardDescription>Comparação entre dispositivos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : (
              <div className="space-y-4">
                <PlatformRow
                  icon={<Smartphone className="w-5 h-5 text-green-500" />}
                  name="Android"
                  shown={stats?.by_platform.android.shown || 0}
                  installed={stats?.by_platform.android.installed || 0}
                />
                <PlatformRow
                  icon={<Apple className="w-5 h-5 text-gray-500" />}
                  name="iOS"
                  shown={stats?.by_platform.ios.shown || 0}
                  installed={stats?.by_platform.ios.installed || 0}
                />
                <PlatformRow
                  icon={<Monitor className="w-5 h-5 text-blue-500" />}
                  name="Desktop"
                  shown={stats?.by_platform.desktop.shown || 0}
                  installed={stats?.by_platform.desktop.installed || 0}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimos 7 dias</CardTitle>
            <CardDescription>Eventos por dia</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40" />
            ) : (
              <div className="space-y-3">
                {stats?.daily_stats.map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="w-12 text-sm text-muted-foreground font-medium">{day.date}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden flex">
                        {day.shown > 0 && (
                          <>
                            <div 
                              className="bg-primary/20 h-full flex items-center justify-center text-xs font-medium"
                              style={{ width: `${Math.max(33, (day.shown / (day.shown + day.installed + day.dismissed)) * 100)}%` }}
                            >
                              {day.shown > 0 && <span className="px-1">{day.shown}</span>}
                            </div>
                            <div 
                              className="bg-green-500 h-full flex items-center justify-center text-xs font-medium text-white"
                              style={{ width: `${day.installed > 0 ? Math.max(20, (day.installed / day.shown) * 100) : 0}%` }}
                            >
                              {day.installed > 0 && <span className="px-1">{day.installed}</span>}
                            </div>
                            <div 
                              className="bg-orange-400 h-full flex items-center justify-center text-xs font-medium text-white"
                              style={{ width: `${day.dismissed > 0 ? Math.max(20, (day.dismissed / day.shown) * 100) : 0}%` }}
                            >
                              {day.dismissed > 0 && <span className="px-1">{day.dismissed}</span>}
                            </div>
                          </>
                        )}
                        {day.shown === 0 && (
                          <span className="text-xs text-muted-foreground px-2 flex items-center">Sem dados</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-primary/20" />
                    <span>Exibidos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span>Instalados</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-orange-400" />
                    <span>Dispensados</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

const StatCard = ({ 
  title, 
  value, 
  icon, 
  description, 
  isLoading,
  variant = 'default'
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  description: string;
  isLoading: boolean;
  variant?: 'default' | 'success' | 'warning' | 'primary';
}) => {
  const variantStyles = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-green-500/10 text-green-500',
    warning: 'bg-orange-500/10 text-orange-500',
    primary: 'bg-primary/10 text-primary',
  };

  return (
    <Card>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{title}</span>
              <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>
                {icon}
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const PlatformRow = ({ 
  icon, 
  name, 
  shown, 
  installed 
}: { 
  icon: React.ReactNode; 
  name: string; 
  shown: number; 
  installed: number;
}) => {
  const rate = shown > 0 ? ((installed / shown) * 100).toFixed(1) : '0';
  
  return (
    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
      <div className="p-2 bg-background rounded-lg">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">
          {shown} exibições • {installed} instalações
        </p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-primary">{rate}%</p>
        <p className="text-xs text-muted-foreground">conversão</p>
      </div>
    </div>
  );
};

const RedirectRow = ({ 
  icon, 
  name, 
  count, 
  total,
  description,
  color
}: { 
  icon: React.ReactNode; 
  name: string; 
  count: number; 
  total: number;
  description: string;
  color: string;
}) => {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
  
  return (
    <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
      <div className="p-2 bg-background rounded-lg">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold">{count}</p>
        <p className="text-xs text-muted-foreground">{percentage}%</p>
      </div>
    </div>
  );
};

export default AdminPWAAnalytics;
