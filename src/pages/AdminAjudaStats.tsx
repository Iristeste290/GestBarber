import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { helpCategories } from "@/data/helpArticles";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  BarChart3
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FeedbackStat {
  article_id: string;
  category_id: string;
  total_feedback: number;
  helpful_count: number;
  not_helpful_count: number;
  helpful_percentage: number;
}

interface FeedbackWithReason {
  id: string;
  article_id: string;
  category_id: string;
  feedback_reason: string;
  created_at: string;
}

export default function AdminAjudaStats() {
  const { loading: authLoading } = useRequireAdmin();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["help-article-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_article_stats")
        .select("*");
      
      if (error) throw error;
      return data as FeedbackStat[];
    }
  });

  const { data: recentFeedback, isLoading: feedbackLoading } = useQuery({
    queryKey: ["help-feedback-with-reasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_article_feedback")
        .select("id, article_id, category_id, feedback_reason, created_at")
        .not("feedback_reason", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as FeedbackWithReason[];
    }
  });

  const getArticleTitle = (articleId: string, categoryId: string) => {
    const category = helpCategories.find(c => c.id === categoryId);
    const article = category?.articles.find(a => a.id === articleId);
    return article?.title || articleId;
  };

  const getCategoryTitle = (categoryId: string) => {
    const category = helpCategories.find(c => c.id === categoryId);
    return category?.title || categoryId;
  };

  // Calculate totals
  const totals = stats?.reduce((acc, stat) => ({
    total: acc.total + stat.total_feedback,
    helpful: acc.helpful + stat.helpful_count,
    notHelpful: acc.notHelpful + stat.not_helpful_count
  }), { total: 0, helpful: 0, notHelpful: 0 }) || { total: 0, helpful: 0, notHelpful: 0 };

  const overallHelpfulPercentage = totals.total > 0 
    ? Math.round((totals.helpful / totals.total) * 100) 
    : 0;

  // Articles needing improvement (less than 70% helpful)
  const needsImprovement = stats?.filter(s => s.helpful_percentage < 70 && s.total_feedback >= 2) || [];

  // Chart data - top articles by feedback count
  const chartData = stats?.slice(0, 8).map(stat => ({
    name: getArticleTitle(stat.article_id, stat.category_id).substring(0, 20) + "...",
    fullName: getArticleTitle(stat.article_id, stat.category_id),
    útil: stat.helpful_count,
    "não útil": stat.not_helpful_count,
    percentage: stat.helpful_percentage
  })) || [];

  // Pie chart data
  const pieData = [
    { name: "Útil", value: totals.helpful, color: "hsl(var(--chart-2))" },
    { name: "Não útil", value: totals.notHelpful, color: "hsl(var(--chart-1))" }
  ];

  // Category breakdown
  const categoryStats = stats?.reduce((acc, stat) => {
    if (!acc[stat.category_id]) {
      acc[stat.category_id] = { total: 0, helpful: 0, notHelpful: 0 };
    }
    acc[stat.category_id].total += stat.total_feedback;
    acc[stat.category_id].helpful += stat.helpful_count;
    acc[stat.category_id].notHelpful += stat.not_helpful_count;
    return acc;
  }, {} as Record<string, { total: number; helpful: number; notHelpful: number }>) || {};

  const categoryChartData = Object.entries(categoryStats).map(([id, data]) => ({
    name: getCategoryTitle(id).substring(0, 15),
    fullName: getCategoryTitle(id),
    útil: data.helpful,
    "não útil": data.notHelpful,
    percentage: data.total > 0 ? Math.round((data.helpful / data.total) * 100) : 0
  })).sort((a, b) => b.útil + b["não útil"] - (a.útil + a["não útil"]));

  if (authLoading || statsLoading) {
    return (
      <AppLayout title="Estatísticas de Ajuda" description="Análise de feedback dos artigos">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Estatísticas de Ajuda" description="Análise de feedback dos artigos">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Feedbacks</p>
                  <p className="text-2xl font-bold">{totals.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <ThumbsUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Úteis</p>
                  <p className="text-2xl font-bold">{totals.helpful}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <ThumbsDown className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Não Úteis</p>
                  <p className="text-2xl font-bold">{totals.notHelpful}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  overallHelpfulPercentage >= 70 ? "bg-green-500/10" : "bg-yellow-500/10"
                }`}>
                  {overallHelpfulPercentage >= 70 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
                  <p className="text-2xl font-bold">{overallHelpfulPercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição de Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {totals.total > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                  Nenhum feedback registrado ainda
                </div>
              )}
            </CardContent>
          </Card>

          {/* Articles Needing Improvement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Artigos que Precisam Melhorar
              </CardTitle>
              <CardDescription>
                Artigos com menos de 70% de aprovação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {needsImprovement.length > 0 ? (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {needsImprovement.map((stat) => (
                      <div 
                        key={`${stat.category_id}-${stat.article_id}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {getArticleTitle(stat.article_id, stat.category_id)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getCategoryTitle(stat.category_id)}
                          </p>
                        </div>
                        <Badge variant={stat.helpful_percentage < 50 ? "destructive" : "secondary"}>
                          {stat.helpful_percentage}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
                  {stats?.length ? "Todos os artigos estão bem avaliados! 🎉" : "Nenhum dado disponível"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Feedback por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  />
                  <Legend />
                  <Bar dataKey="útil" fill="hsl(var(--chart-2))" stackId="a" />
                  <Bar dataKey="não útil" fill="hsl(var(--chart-1))" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Nenhum feedback registrado ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Feedback with Reasons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comentários Recentes</CardTitle>
            <CardDescription>
              Feedback negativo com explicações dos usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedbackLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentFeedback && recentFeedback.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {recentFeedback.map((feedback) => (
                    <div 
                      key={feedback.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-medium">
                            {getArticleTitle(feedback.article_id, feedback.category_id)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getCategoryTitle(feedback.category_id)}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(feedback.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground italic">
                        "{feedback.feedback_reason}"
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
                Nenhum comentário registrado ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
