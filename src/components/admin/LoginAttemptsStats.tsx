import { useLoginAttemptStats } from "@/hooks/useLoginAttempts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, CheckCircle, XCircle, Lock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function LoginAttemptsStats() {
  const { data: stats, isLoading } = useLoginAttemptStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total (24h)",
      value: stats?.totalAttempts || 0,
      icon: LogIn,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Sucesso",
      value: stats?.successfulLogins || 0,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Falhas",
      value: stats?.failedAttempts || 0,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Bloqueados",
      value: stats?.blockedAccounts || 0,
      icon: Lock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Emails Únicos",
      value: stats?.uniqueEmails || 0,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
