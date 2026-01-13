import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Target, Users, DollarSign, Calendar } from "lucide-react";
import { useSimulatorData, calculateSimulation, SimulationResult } from "@/hooks/useRevenueSimulator";
import { Skeleton } from "@/components/ui/skeleton";

export const RevenueSimulator = () => {
  const { data: simulatorData, isLoading } = useSimulatorData();
  const [targetValue, setTargetValue] = useState<string>("");
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleSimulate = () => {
    if (!simulatorData || !targetValue) return;
    
    const target = parseFloat(targetValue.replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (isNaN(target) || target <= 0) return;

    const simulation = calculateSimulation(simulatorData, target);
    setResult(simulation);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Simulador de Faturamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Stats */}
        {simulatorData && (
          <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-muted/50 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Atual</p>
              <p className="font-semibold">{formatCurrency(simulatorData.currentMonthlyRevenue)}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Ticket Médio</p>
              <p className="font-semibold">{formatCurrency(simulatorData.avgTicket)}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-xs">Cortes/Dia</p>
              <p className="font-semibold">{simulatorData.cutsPerDay}</p>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
            <Input
              type="text"
              placeholder="Meta de faturamento"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSimulate} disabled={!targetValue}>
            <Target className="h-4 w-4 mr-1" />
            Simular
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-3">
            {result.gap > 0 ? (
              <>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Para atingir {formatCurrency(result.targetValue)}</p>
                  <p className="font-semibold">Você precisa de +{formatCurrency(result.gap)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">Opção A: Mais clientes</p>
                      <p className="text-sm text-muted-foreground">{result.optionA.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                    <div className="flex-1">
                      <p className="font-medium">Opção B: Aumentar ticket</p>
                      <p className="text-sm text-muted-foreground">
                        {result.optionB.description} (novo: {formatCurrency(result.optionB.newTicket)})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    <div className="flex-1">
                      <p className="font-medium">Opção C: Mais dias</p>
                      <p className="text-sm text-muted-foreground">{result.optionC.description}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-emerald-600 font-semibold">🎉 Você já atingiu essa meta!</p>
                <p className="text-sm text-muted-foreground">
                  Atual: {formatCurrency(result.currentRevenue)}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
