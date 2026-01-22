import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Sparkles,
  Clock,
  Target,
  Lightbulb,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GrowthFeatureGate } from "./GrowthFeatureGate";
import { formatCurrency } from "@/lib/exportUtils";

interface ServicePricing {
  serviceName: string;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  peakPriceModifier: number;
  offPeakDiscount: number;
}

interface PricingSuggestion {
  type: string;
  title: string;
  description: string;
  expectedImpact: string;
  implementation: string;
  priority: "high" | "medium" | "low";
}

interface PricingData {
  occupancyRate: number;
  totalAppointments: number;
  peakPeriods: Array<{ day: string; hour: number; count: number }>;
  lowPeriods: Array<{ day: string; hour: number; count: number }>;
  services: Array<{ name: string; currentPrice: number; demand: number; revenue: number }>;
  pricingSuggestions: {
    overallAnalysis: string;
    occupancyStatus: "low" | "medium" | "high";
    suggestions: PricingSuggestion[];
    servicePricing: ServicePricing[];
    quickWins: string[];
  };
}

export const DynamicPricingCard = () => {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzePricing = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("dynamic-pricing");

      if (error) throw error;

      setPricingData(data);
      toast.success("Análise de preços concluída!");
    } catch (error: any) {
      toast.error("Erro ao analisar preços", {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getOccupancyColor = (status: string) => {
    switch (status) {
      case "high": return "text-green-500";
      case "medium": return "text-yellow-500";
      default: return "text-red-500";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500">Alta</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500 text-black">Média</Badge>;
      default:
        return <Badge variant="outline">Baixa</Badge>;
    }
  };

  const content = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Sugestões de Preços Dinâmicos (IA)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Otimize seus preços baseado em demanda, horários e sazonalidade
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!pricingData && !loading && (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              Analise seus dados dos últimos 90 dias para receber sugestões personalizadas de precificação
            </p>
            <Button onClick={analyzePricing} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Analisar Preços com IA
            </Button>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {pricingData && (
          <>
            {/* Overall Analysis */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-primary">Análise Geral</p>
                  <p className="text-sm text-foreground/80 mt-1">
                    {pricingData.pricingSuggestions.overallAnalysis}
                  </p>
                </div>
              </div>
            </div>

            {/* Occupancy Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Taxa de Ocupação</span>
                <span className={`text-lg font-bold ${getOccupancyColor(pricingData.pricingSuggestions.occupancyStatus)}`}>
                  {pricingData.occupancyRate}%
                </span>
              </div>
              <Progress value={pricingData.occupancyRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {pricingData.totalAppointments} agendamentos nos últimos 90 dias
              </p>
            </div>

            {/* Peak & Low Periods */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Horários de Pico</span>
                </div>
                <div className="space-y-1">
                  {pricingData.peakPeriods.slice(0, 3).map((p, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{p.day} {p.hour}:00</span>
                      <span className="text-green-500">{p.count} agend.</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Horários Vazios</span>
                </div>
                <div className="space-y-1">
                  {pricingData.lowPeriods.slice(0, 3).map((p, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{p.day} {p.hour}:00</span>
                      <span className="text-orange-500">{p.count} agend.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Service Pricing Suggestions */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Sugestões por Serviço
              </h4>
              <div className="space-y-2">
                {pricingData.pricingSuggestions.servicePricing.map((service, i) => {
                  const diff = service.suggestedPrice - service.currentPrice;
                  const diffPercent = ((diff / service.currentPrice) * 100).toFixed(0);
                  
                  return (
                    <div key={i} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{service.serviceName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground line-through text-sm">
                            {formatCurrency(service.currentPrice)}
                          </span>
                          <span className={`font-bold ${diff > 0 ? "text-green-500" : diff < 0 ? "text-orange-500" : ""}`}>
                            {formatCurrency(service.suggestedPrice)}
                          </span>
                          {diff !== 0 && (
                            <Badge variant={diff > 0 ? "default" : "secondary"} className="gap-1">
                              {diff > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              {diffPercent}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{service.reason}</p>
                      <div className="flex gap-2 mt-2 text-xs">
                        {service.peakPriceModifier > 0 && (
                          <Badge variant="outline" className="text-green-500">
                            +{service.peakPriceModifier}% no pico
                          </Badge>
                        )}
                        {service.offPeakDiscount < 0 && (
                          <Badge variant="outline" className="text-orange-500">
                            {service.offPeakDiscount}% fora do pico
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategic Suggestions */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Estratégias Recomendadas
              </h4>
              <div className="space-y-3">
                {pricingData.pricingSuggestions.suggestions.map((sug, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium">{sug.title}</span>
                      {getPriorityBadge(sug.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{sug.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {sug.expectedImpact}
                      </Badge>
                      <span className="text-muted-foreground">{sug.implementation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Wins */}
            <div className="p-4 rounded-lg bg-accent/50">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Ações Rápidas
              </h4>
              <ul className="space-y-1">
                {pricingData.pricingSuggestions.quickWins.map((win, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    {win}
                  </li>
                ))}
              </ul>
            </div>

            {/* Refresh Button */}
            <Button 
              variant="outline" 
              onClick={analyzePricing} 
              disabled={loading}
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Atualizar Análise
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <GrowthFeatureGate 
      featureName="Preços Dinâmicos"
      featureDescription="Receba sugestões de precificação baseadas em demanda, sazonalidade e comportamento dos clientes."
    >
      {content}
    </GrowthFeatureGate>
  );
};
