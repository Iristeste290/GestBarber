import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, Users, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TrialFeedback {
  id: string;
  user_id: string;
  rating: number;
  liked_features: string[] | null;
  improvement_suggestion: string | null;
  would_recommend: boolean | null;
  plan_type: string | null;
  created_at: string;
}

interface FeedbackStats {
  totalFeedbacks: number;
  averageRating: number;
  wouldRecommendPercent: number;
  topFeatures: { feature: string; count: number }[];
}

const FEATURE_LABELS: Record<string, string> = {
  agenda: "Agenda de agendamentos",
  barbeiros: "Gestão de barbeiros",
  servicos: "Catálogo de serviços",
  relatorios: "Relatórios e métricas",
  interface: "Interface fácil de usar",
  agenda_publica: "Link de agendamento público",
};

const AdminTrialFeedback = () => {
  const { isAdmin, loading: isAdminLoading } = useRequireAdmin();
  const [feedbacks, setFeedbacks] = useState<TrialFeedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState<string>("all");

  const filteredFeedbacks = useMemo(() => {
    if (planFilter === "all") return feedbacks;
    return feedbacks.filter(f => (f.plan_type || "freemium") === planFilter);
  }, [feedbacks, planFilter]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchFeedbacks = async () => {
      // Fetch all feedbacks (admin has access via service role through edge function or direct query)
      const { data, error } = await supabase
        .from("trial_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar feedbacks:", error);
        setLoading(false);
        return;
      }

      const feedbackData = data as TrialFeedback[];
      setFeedbacks(feedbackData);

      // Calculate stats
      if (feedbackData.length > 0) {
        const totalFeedbacks = feedbackData.length;
        const averageRating = feedbackData.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks;
        const recommendCount = feedbackData.filter(f => f.would_recommend === true).length;
        const wouldRecommendPercent = (recommendCount / feedbackData.filter(f => f.would_recommend !== null).length) * 100 || 0;

        // Count features
        const featureCounts: Record<string, number> = {};
        feedbackData.forEach(f => {
          f.liked_features?.forEach(feature => {
            featureCounts[feature] = (featureCounts[feature] || 0) + 1;
          });
        });

        const topFeatures = Object.entries(featureCounts)
          .map(([feature, count]) => ({ feature, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          totalFeedbacks,
          averageRating,
          wouldRecommendPercent,
          topFeatures,
        });
      }

      setLoading(false);
    };

    fetchFeedbacks();
  }, [isAdmin]);

  if (isAdminLoading || loading) {
    return <FullPageLoader text="Carregando feedbacks..." />;
  }

  if (!isAdmin) {
    return null;
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <AppLayout
      title="Feedbacks do Trial"
      description="Visualize os feedbacks dos usuários que terminaram o período gratuito"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total de Feedbacks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalFeedbacks}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Nota Média
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
                  {renderStars(Math.round(stats.averageRating))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4" />
                  Recomendariam
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.wouldRecommendPercent.toFixed(0)}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Feature Mais Popular
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium truncate">
                  {stats.topFeatures[0] ? FEATURE_LABELS[stats.topFeatures[0].feature] || stats.topFeatures[0].feature : "-"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Features */}
        {stats && stats.topFeatures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Features Mais Curtidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.topFeatures.map(({ feature, count }) => (
                  <Badge key={feature} variant="secondary" className="text-sm py-1 px-3">
                    {FEATURE_LABELS[feature] || feature} ({count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedbacks Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Todos os Feedbacks
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filtrar plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="freemium">Free</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredFeedbacks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {planFilter === "all" ? "Nenhum feedback recebido ainda." : "Nenhum feedback para este plano."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead>Recomendaria</TableHead>
                      <TableHead>Features Curtidas</TableHead>
                      <TableHead className="min-w-[200px]">Sugestão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeedbacks.map((feedback) => (
                      <TableRow key={feedback.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(feedback.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={feedback.plan_type === "freemium" ? "secondary" : "default"}
                            className={feedback.plan_type === "anual" ? "bg-amber-500" : ""}
                          >
                            {feedback.plan_type === "freemium" ? "Free" : 
                             feedback.plan_type === "mensal" ? "Mensal" : 
                             feedback.plan_type === "anual" ? "Anual" : "Free"}
                          </Badge>
                        </TableCell>
                        <TableCell>{renderStars(feedback.rating)}</TableCell>
                        <TableCell>
                          {feedback.would_recommend === true ? (
                            <Badge variant="default" className="bg-green-500">
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Sim
                            </Badge>
                          ) : feedback.would_recommend === false ? (
                            <Badge variant="destructive">
                              <ThumbsDown className="w-3 h-3 mr-1" />
                              Não
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {feedback.liked_features?.map((feature) => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {FEATURE_LABELS[feature] || feature}
                              </Badge>
                            )) || <span className="text-muted-foreground">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {feedback.improvement_suggestion ? (
                            <p className="text-sm max-w-xs truncate" title={feedback.improvement_suggestion}>
                              {feedback.improvement_suggestion}
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
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

export default AdminTrialFeedback;
