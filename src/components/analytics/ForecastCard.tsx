import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/exportUtils";

interface ForecastCardProps {
  historicalData: Array<{ month: string; revenue: number }>;
}

export const ForecastCard = ({ historicalData }: ForecastCardProps) => {
  const [forecast, setForecast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateForecast = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predict-revenue', {
        body: { historicalData }
      });

      if (error) throw error;
      setForecast(data.forecast);
    } catch (error: any) {
      toast.error('Erro ao gerar previsão', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Previsão de Faturamento (IA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!forecast ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              Use IA para prever o faturamento do próximo mês baseado nos últimos 6 meses
            </p>
            <Button onClick={generateForecast} disabled={loading}>
              {loading ? 'Analisando...' : 'Gerar Previsão com IA'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-5 bg-gradient-to-br from-primary/5 via-accent/50 to-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-primary">Análise da IA</p>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {forecast}
                </p>
              </div>
            </div>
            <Button onClick={generateForecast} variant="outline" size="sm" disabled={loading} className="gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              {loading ? 'Atualizando...' : 'Atualizar Previsão'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
