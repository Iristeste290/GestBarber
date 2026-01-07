import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, AlertTriangle, Activity } from "lucide-react";
import { FraudLog } from "@/hooks/useFraudLogs";

interface FraudStatsCardsProps {
  logs: FraudLog[];
}

export const FraudStatsCards = ({ logs }: FraudStatsCardsProps) => {
  const totalAttempts = logs?.length || 0;
  const allowedCount = logs?.filter((l) => l.status === "allowed").length || 0;
  const blockedCount = logs?.filter((l) => l.status === "blocked").length || 0;
  const warningCount = logs?.filter((l) => l.status === "warning").length || 0;

  const uniqueIps = new Set(logs?.map((l) => l.ip_address)).size;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Tentativas</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAttempts}</div>
          <p className="text-xs text-muted-foreground">{uniqueIps} IPs únicos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Permitidas</CardTitle>
          <ShieldCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{allowedCount}</div>
          <p className="text-xs text-muted-foreground">
            {totalAttempts > 0 ? ((allowedCount / totalAttempts) * 100).toFixed(1) : 0}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bloqueadas</CardTitle>
          <ShieldAlert className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{blockedCount}</div>
          <p className="text-xs text-muted-foreground">
            {totalAttempts > 0 ? ((blockedCount / totalAttempts) * 100).toFixed(1) : 0}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
          <p className="text-xs text-muted-foreground">
            {totalAttempts > 0 ? ((warningCount / totalAttempts) * 100).toFixed(1) : 0}% do total
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
