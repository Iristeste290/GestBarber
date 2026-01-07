import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, DollarSign, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface BarberGoal {
  id: string;
  barber_id: string;
  week_start_date: string;
  week_end_date: string;
  target_haircuts: number;
  target_avg_ticket: number;
  target_product_sales: number;
  current_haircuts: number;
  current_avg_ticket: number;
  current_product_sales: number;
  barbers: {
    name: string;
    avatar_url: string | null;
  };
}

const Metas = () => {
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery<BarberGoal[]>({
    queryKey: ["barber-goals"],
    queryFn: async () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const weekStart = monday.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("barber_goals")
        .select(`
          *,
          barbers (
            name,
            avatar_url
          )
        `)
        .eq('week_start_date', weekStart)
        .order('current_haircuts', { ascending: false });

      if (error) throw error;
      return data as BarberGoal[];
    },
  });

  // Atualizar progresso em tempo real
  useEffect(() => {
    const updateProgress = async () => {
      try {
        const { error } = await supabase.rpc('update_barber_goals_progress');
        if (!error) {
          queryClient.invalidateQueries({ queryKey: ["barber-goals"] });
        }
      } catch (err) {
        console.error("Erro ao atualizar progresso:", err);
      }
    };

    updateProgress();
    const interval = setInterval(updateProgress, 60000); // Atualiza a cada 1 minuto

    return () => clearInterval(interval);
  }, [queryClient]);

  const handleRefresh = async () => {
    try {
      const { error } = await supabase.rpc('update_barber_goals_progress');
      if (error) throw error;
      
      await queryClient.invalidateQueries({ queryKey: ["barber-goals"] });
      toast.success("Progresso atualizado!");
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "text-green-600";
    if (progress >= 75) return "text-blue-600";
    if (progress >= 50) return "text-yellow-600";
    return "text-orange-600";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <AppLayout
      title="Metas Semanais"
      description="Acompanhe o progresso das metas dos barbeiros"
    >
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
            {goals && goals.length > 0 && (
              <span className="text-sm text-muted-foreground">
                Semana: {formatDate(goals[0].week_start_date)} - {formatDate(goals[0].week_end_date)}
              </span>
            )}
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !goals || goals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhuma meta encontrada
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                As metas são geradas automaticamente toda segunda-feira
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => {
              const haircutsProgress = calculateProgress(goal.current_haircuts, goal.target_haircuts);
              const ticketProgress = calculateProgress(goal.current_avg_ticket, goal.target_avg_ticket);
              const productsProgress = calculateProgress(goal.current_product_sales, goal.target_product_sales);
              
              const overallProgress = (haircutsProgress + ticketProgress + productsProgress) / 3;

              return (
                <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{goal.barbers.name}</CardTitle>
                      <Badge variant={overallProgress >= 75 ? "default" : "secondary"}>
                        {Math.round(overallProgress)}%
                      </Badge>
                    </div>
                    <CardDescription>Progresso Geral</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Meta de Cortes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="font-medium">Cortes</span>
                        </div>
                        <span className={getProgressColor(haircutsProgress)}>
                          {goal.current_haircuts}/{goal.target_haircuts}
                        </span>
                      </div>
                      <Progress value={haircutsProgress} className="h-2" />
                    </div>

                    {/* Meta de Ticket Médio */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <span className="font-medium">Ticket Médio</span>
                        </div>
                        <span className={getProgressColor(ticketProgress)}>
                          {formatCurrency(goal.current_avg_ticket)}/{formatCurrency(goal.target_avg_ticket)}
                        </span>
                      </div>
                      <Progress value={ticketProgress} className="h-2" />
                    </div>

                    {/* Meta de Produtos */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="font-medium">Vendas</span>
                        </div>
                        <span className={getProgressColor(productsProgress)}>
                          {formatCurrency(goal.current_product_sales)}/{formatCurrency(goal.target_product_sales)}
                        </span>
                      </div>
                      <Progress value={productsProgress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Metas;
