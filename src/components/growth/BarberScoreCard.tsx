import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, User } from "lucide-react";
import { BarberScore } from "@/hooks/useGrowthEngine";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface BarberScoreCardProps {
  scores: BarberScore[];
  isLoading: boolean;
}

export const BarberScoreCard = ({ scores, isLoading }: BarberScoreCardProps) => {
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return "text-yellow-500 bg-yellow-100";
      case 2: return "text-gray-400 bg-gray-100";
      case 3: return "text-amber-600 bg-amber-100";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (scores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Ranking de Barbeiros
          </CardTitle>
          <CardDescription>
            Nenhum barbeiro com dados disponíveis ainda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Os scores serão calculados conforme os agendamentos forem realizados.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Ranking de Barbeiros
        </CardTitle>
        <CardDescription>
          Score baseado em atendimentos, cancelamentos e faltas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scores.map((score, index) => {
            const rank = index + 1;
            return (
              <div 
                key={score.id} 
                className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50"
              >
                {/* Rank Badge */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getMedalColor(rank)}`}>
                  {rank <= 3 ? (
                    <Trophy className="h-5 w-5" />
                  ) : (
                    <span className="font-bold">{rank}º</span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage src={score.barber?.avatar_url || ""} alt={score.barber?.name} />
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{score.barber?.name || "Barbeiro"}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getScoreColor(score.score)}`}>
                        {score.score}
                      </span>
                      <span className="text-sm text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={score.score} 
                    className="h-2 mb-2"
                  />
                  
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="gap-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      {score.completed_appointments} atendimentos
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      {formatCurrency(score.revenue)}
                    </Badge>
                    {score.canceled_appointments > 0 && (
                      <Badge variant="outline" className="gap-1 text-red-500">
                        <TrendingDown className="h-3 w-3" />
                        {score.canceled_appointments} cancelados
                      </Badge>
                    )}
                    {score.no_show_clients > 0 && (
                      <Badge variant="outline" className="gap-1 text-orange-500">
                        {score.no_show_clients} faltas
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
