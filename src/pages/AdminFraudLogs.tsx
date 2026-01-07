import { useState } from "react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { useFraudLogs } from "@/hooks/useFraudLogs";
import { useLoginAttempts } from "@/hooks/useLoginAttempts";
import { AppLayout } from "@/components/AppLayout";
import { FraudLogsTable } from "@/components/admin/FraudLogsTable";
import { FraudStatsCards } from "@/components/admin/FraudStatsCards";
import { FraudAttemptsChart } from "@/components/admin/FraudAttemptsChart";
import { LoginAttemptsTable } from "@/components/admin/LoginAttemptsTable";
import { LoginAttemptsStats } from "@/components/admin/LoginAttemptsStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, RefreshCw, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminFraudLogs = () => {
  const { loading: authLoading } = useRequireAdmin();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loginFilter, setLoginFilter] = useState<string>("all");

  const { data: logs, isLoading, refetch, isFetching } = useFraudLogs(statusFilter);
  const { 
    data: loginAttempts, 
    isLoading: loginLoading, 
    refetch: refetchLogin, 
    isFetching: loginFetching 
  } = useLoginAttempts(loginFilter === "all" ? undefined : loginFilter);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout
      title="Logs de Segurança"
      description="Monitore tentativas de registro, login e atividades suspeitas"
    >
      <Tabs defaultValue="login" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="login" className="flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            Tentativas de Login
          </TabsTrigger>
          <TabsTrigger value="fraud" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Registro/Fraude
          </TabsTrigger>
        </TabsList>

        {/* Login Attempts Tab */}
        <TabsContent value="login" className="space-y-6">
          {/* Stats Cards */}
          <LoginAttemptsStats />

          {/* Login Attempts Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle>Tentativas de Login</CardTitle>
                    <CardDescription>Histórico de logins bem-sucedidos e falhos</CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Select value={loginFilter} onValueChange={setLoginFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="failed">Falha</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetchLogin()}
                    disabled={loginFetching}
                  >
                    <RefreshCw className={`h-4 w-4 ${loginFetching ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LoginAttemptsTable attempts={loginAttempts || []} isLoading={loginLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fraud Logs Tab */}
        <TabsContent value="fraud" className="space-y-6">
          {/* Stats Cards */}
          <FraudStatsCards logs={logs || []} />

          {/* Chart */}
          <FraudAttemptsChart />

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle>Registro de Tentativas</CardTitle>
                    <CardDescription>Histórico detalhado de tentativas de registro</CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="allowed">Permitido</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                      <SelectItem value="warning">Alerta</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetch()}
                    disabled={isFetching}
                  >
                    <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FraudLogsTable logs={logs || []} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default AdminFraudLogs;
