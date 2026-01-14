import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CashHistory } from "@/components/caixa/CashHistory";
import { SessionHeader } from "@/components/caixa/SessionHeader";
import { TransactionForm } from "@/components/caixa/TransactionForm";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useCashSession } from "@/hooks/useCashSession";
import { CashRegisterSkeleton } from "@/components/skeletons/PageSkeletons";
import { useGrowthTriggers } from "@/components/upgrade/GrowthTriggerProvider";
import { useNavigate } from "react-router-dom";
import { Users, TrendingUp } from "lucide-react";

const Caixa = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const { metrics, isStart } = useGrowthTriggers();
  const navigate = useNavigate();
  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const {
    session,
    sessionLoading,
    dailyTransactions,
    weeklyRevenue,
    monthlyRevenue,
    dailyBalance,
    openSession,
    closeSession,
    addTransaction,
  } = useCashSession(user?.id);

  const dailyEntries = dailyTransactions
    .filter((t) => t.transaction_type === "entrada")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const dailyExits = dailyTransactions
    .filter((t) => t.transaction_type === "saida")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const handleOpenSession = async () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) return;
    
    const success = await openSession(amount);
    if (success) setOpeningAmount("");
  };

  const handleCloseSession = async () => {
    const amount = parseFloat(closingAmount);
    if (isNaN(amount) || amount < 0) return;

    const success = await closeSession(amount, closingNotes);
    if (success) {
      setClosingAmount("");
      setClosingNotes("");
    }
  };

  // Calculate lost clients revenue
  const lostClientsRevenue = metrics ? Math.round(metrics.lostClients30d * metrics.avgTicket * 2) : 0;

  return (
    <AppLayout title="Controle de Caixa" description="Gerencie suas entradas e saídas">
      {authLoading || sessionLoading ? (
        <div className="px-3 md:px-0">
          <CashRegisterSkeleton />
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6 px-3 md:px-0">
          {/* Banner Growth Engine - Clientes perdidos (apenas para plano Start) */}
          {isStart && metrics && metrics.lostClients30d >= 5 && (
            <Alert className="border-orange-500/50 bg-gradient-to-r from-orange-500/10 to-red-500/10">
              <Users className="h-4 w-4 text-orange-500" />
              <AlertTitle className="flex items-center gap-2 text-orange-600">
                <span>{metrics.lostClients30d} clientes não voltaram nos últimos 30 dias</span>
              </AlertTitle>
              <AlertDescription className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Isso representa aproximadamente <strong className="text-orange-600">R$ {lostClientsRevenue}</strong> em receita perdida.
                  O Growth Engine envia mensagens automáticas para reativar esses clientes.
                </p>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/planos')}
                  className="bg-gradient-to-r from-[#C9B27C] to-[#E5D4A1] hover:from-[#D4BD87] hover:to-[#F0DFA9] text-black"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Recuperar Clientes com Growth
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
        {!session ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Abrir Caixa</CardTitle>
              <CardDescription className="text-sm">Inicie uma nova sessão de caixa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="opening-amount">Valor Inicial (R$)</Label>
                <Input
                  id="opening-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                />
              </div>
              <Button onClick={handleOpenSession} className="w-full sm:w-auto">
                Abrir Caixa
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <SessionHeader
              dailyBalance={dailyBalance}
              weeklyRevenue={weeklyRevenue}
              monthlyRevenue={monthlyRevenue}
              dailyEntries={dailyEntries}
              dailyExits={dailyExits}
            />

            <Tabs defaultValue="movimentacoes" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="movimentacoes" className="text-xs md:text-sm">Movimentações</TabsTrigger>
                <TabsTrigger value="historico" className="text-xs md:text-sm">Histórico</TabsTrigger>
                <TabsTrigger value="fechar" className="text-xs md:text-sm">Fechar Caixa</TabsTrigger>
              </TabsList>

              <TabsContent value="movimentacoes" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
                <TransactionForm onAddTransaction={addTransaction} />
              </TabsContent>

              <TabsContent value="historico" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
                <CashHistory userId={user?.id || ""} />
              </TabsContent>

              <TabsContent value="fechar" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Fechar Caixa</CardTitle>
                    <CardDescription className="text-sm">Encerre a sessão atual do caixa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    <div className="space-y-2">
                      <Label>Saldo Calculado</Label>
                      <div className="text-xl md:text-2xl font-bold">
                        R$ {dailyBalance.toFixed(2)}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="closing-amount">Valor em Caixa (R$)</Label>
                      <Input
                        id="closing-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={closingAmount}
                        onChange={(e) => setClosingAmount(e.target.value)}
                      />
                    </div>

                    {closingAmount && (
                      <div className="space-y-2">
                        <Label>Diferença</Label>
                        <div className={`text-lg md:text-xl font-bold ${
                          parseFloat(closingAmount) - dailyBalance >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}>
                          R$ {(parseFloat(closingAmount) - dailyBalance).toFixed(2)}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="closing-notes">Observações (opcional)</Label>
                      <Textarea
                        id="closing-notes"
                        placeholder="Digite observações sobre o fechamento..."
                        value={closingNotes}
                        onChange={(e) => setClosingNotes(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    <Button
                      onClick={handleCloseSession}
                      variant="destructive"
                      className="w-full sm:w-auto"
                      disabled={!closingAmount}
                    >
                      Fechar Caixa
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
        </div>
      )}
    </AppLayout>
  );
};

export default Caixa;
