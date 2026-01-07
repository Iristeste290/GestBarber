import { useEffect, useState, useMemo } from "react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Users, TrendingUp, Mail, Clock, CheckCircle2, BarChart3 } from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface WaitlistEntry {
  id: string;
  email: string;
  feature_name: string;
  created_at: string;
  notified_at: string | null;
}

interface FeatureStats {
  feature_name: string;
  count: number;
  lastSignup: string;
}

const MILESTONES = [10, 25, 50, 100];

// Chart colors for features
const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(199, 89%, 48%)",
  "hsl(0, 84%, 60%)",
];

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  total: number;
  [key: string]: string | number;
}

// Evolution Chart Component
const WaitlistEvolutionChart = ({ entries, isLoading }: { entries: WaitlistEntry[]; isLoading: boolean }) => {
  const chartData = useMemo(() => {
    if (entries.length === 0) return [];

    // Get last 30 days
    const endDate = new Date();
    const startDate = subDays(endDate, 29);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Get unique features
    const features = [...new Set(entries.map(e => e.feature_name))];

    // Build cumulative data per day
    const data: ChartDataPoint[] = days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const point: ChartDataPoint = {
        date: format(day, "yyyy-MM-dd"),
        dateLabel: format(day, "dd/MM", { locale: ptBR }),
        total: 0,
      };

      // Count cumulative entries up to this day for each feature
      features.forEach(feature => {
        const count = entries.filter(
          e => e.feature_name === feature && new Date(e.created_at) <= dayEnd
        ).length;
        point[feature] = count;
        point.total += count;
      });

      return point;
    });

    return data;
  }, [entries]);

  const features = useMemo(() => {
    return [...new Set(entries.map(e => e.feature_name))];
  }, [entries]);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {
      total: { label: "Total", color: "hsl(var(--muted-foreground))" },
    };
    features.forEach((feature, index) => {
      config[feature] = {
        label: feature,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });
    return config;
  }, [features]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Evolução de Inscrições
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Evolução de Inscrições
          </CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16 text-muted-foreground">
            Nenhum dado para exibir
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Evolução de Inscrições
        </CardTitle>
        <CardDescription>
          Crescimento acumulado por feature nos últimos 30 dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {features.map((feature, index) => (
                  <linearGradient key={feature} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {features.map((feature, index) => (
                <Area
                  key={feature}
                  type="monotone"
                  dataKey={feature}
                  stackId="1"
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  fill={`url(#gradient-${index})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

const AdminWaitlistStats = () => {
  const { loading: authLoading } = useRequireAdmin();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [featureStats, setFeatureStats] = useState<FeatureStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch all waitlist entries using service role via edge function or direct query
      const { data, error } = await supabase
        .from("feature_waitlist")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setEntries(data || []);

      // Calculate stats per feature
      const statsMap = new Map<string, { count: number; lastSignup: string }>();
      (data || []).forEach((entry) => {
        const existing = statsMap.get(entry.feature_name);
        if (existing) {
          existing.count++;
          if (new Date(entry.created_at) > new Date(existing.lastSignup)) {
            existing.lastSignup = entry.created_at;
          }
        } else {
          statsMap.set(entry.feature_name, {
            count: 1,
            lastSignup: entry.created_at,
          });
        }
      });

      const stats: FeatureStats[] = Array.from(statsMap.entries())
        .map(([feature_name, data]) => ({
          feature_name,
          count: data.count,
          lastSignup: data.lastSignup,
        }))
        .sort((a, b) => b.count - a.count);

      setFeatureStats(stats);
    } catch (error) {
      console.error("Error fetching waitlist data:", error);
      toast.error("Erro ao carregar dados da waitlist");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up realtime subscription
    const channel = supabase
      .channel("waitlist-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "feature_waitlist",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleTestMilestones = async () => {
    try {
      const response = await supabase.functions.invoke("check-waitlist-milestones");
      if (response.error) throw response.error;
      toast.success("Verificação de milestones executada!");
      console.log("Milestone check result:", response.data);
    } catch (error) {
      console.error("Error checking milestones:", error);
      toast.error("Erro ao verificar milestones");
    }
  };

  const getNextMilestone = (count: number) => {
    return MILESTONES.find((m) => m > count) || null;
  };

  const getMilestoneProgress = (count: number) => {
    const nextMilestone = getNextMilestone(count);
    if (!nextMilestone) return 100;
    const prevMilestone = MILESTONES[MILESTONES.indexOf(nextMilestone) - 1] || 0;
    return Math.round(((count - prevMilestone) / (nextMilestone - prevMilestone)) * 100);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalSignups = entries.length;
  const uniqueEmails = new Set(entries.map((e) => e.email)).size;
  const featuresCount = featureStats.length;

  return (
    <AppLayout
      title="Waitlist Dashboard"
      description="Acompanhe o interesse dos usuários nas funcionalidades em desenvolvimento"
    >
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleTestMilestones}>
            <Mail className="h-4 w-4 mr-2" />
            Testar Milestones
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Inscrições</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSignups}</div>
              <p className="text-xs text-muted-foreground">
                {uniqueEmails} emails únicos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Features Ativas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{featuresCount}</div>
              <p className="text-xs text-muted-foreground">
                com interesse registrado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximo Milestone</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {featureStats[0] && (
                <>
                  <div className="text-2xl font-bold">
                    {getNextMilestone(featureStats[0].count) || "🎉 Completo"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {featureStats[0].feature_name}: {getMilestoneProgress(featureStats[0].count)}% do próximo
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Evolution Chart */}
        <WaitlistEvolutionChart entries={entries} isLoading={isLoading} />

        {/* Features Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ranking de Features
            </CardTitle>
            <CardDescription>
              Features ordenadas por interesse dos usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : featureStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma inscrição na waitlist ainda
              </div>
            ) : (
              <div className="space-y-4">
                {featureStats.map((stat, index) => {
                  const nextMilestone = getNextMilestone(stat.count);
                  const progress = getMilestoneProgress(stat.count);
                  const reachedMilestones = MILESTONES.filter((m) => stat.count >= m);

                  return (
                    <div key={stat.feature_name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-muted-foreground">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{stat.feature_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Último: {format(new Date(stat.lastSignup), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {reachedMilestones.map((m) => (
                            <Badge key={m} variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              {m}+
                            </Badge>
                          ))}
                          <Badge variant="default" className="text-lg px-3">
                            {stat.count}
                          </Badge>
                        </div>
                      </div>
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {nextMilestone && (
                        <p className="text-xs text-muted-foreground text-right">
                          {stat.count}/{nextMilestone} para próximo milestone
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Inscrições Recentes
            </CardTitle>
            <CardDescription>
              Últimas 20 inscrições na waitlist
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma inscrição ainda
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Feature</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Notificado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.slice(0, 20).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.feature_name}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(entry.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {entry.notified_at ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Sim
                            </Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminWaitlistStats;
