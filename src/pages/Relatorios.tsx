import { AppLayout } from "@/components/AppLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import { PeriodComparison } from "@/components/analytics/PeriodComparison";
import { PeakHoursChart } from "@/components/analytics/PeakHoursChart";
import { ForecastCard } from "@/components/analytics/ForecastCard";
import { ExportButtons } from "@/components/analytics/ExportButtons";
import { CombinedMonthlyReport } from "@/components/analytics/CombinedMonthlyReport";
import { CustomerMap } from "@/components/analytics/CustomerMap";
import { GrowthFeatureGate } from "@/components/growth/GrowthFeatureGate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsPageSkeleton } from "@/components/skeletons/PageSkeletons";
import { EducationalTips } from "@/components/conversion";
import { BlurredPreview } from "@/components/conversion/BlurredPreview";

const Relatorios = () => {
  const { loading: authLoading } = useRequireAuth();
  const {
    monthlyComparison,
    loadingMonthly,
    weeklyComparison,
    loadingWeekly,
    peakHours,
    loadingPeakHours,
    historicalData,
  } = useAnalytics();

  const isLoading = authLoading || loadingMonthly || loadingWeekly || loadingPeakHours;

  return (
    <AppLayout 
      title="Relatórios Avançados" 
      description="Análise completa com comparações e previsões"
    >
      {isLoading ? (
        <ReportsPageSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Dica educativa */}
          <EducationalTips context="relatorios" />
          
          <div className="flex justify-end">
            <ExportButtons 
              monthlyData={monthlyComparison}
              weeklyData={weeklyComparison}
              peakHours={peakHours}
            />
          </div>

          <Tabs defaultValue="combined" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1">
              <TabsTrigger value="combined" className="text-xs py-2 px-1 leading-tight whitespace-normal h-auto">Relatório Mensal</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs py-2 px-1 leading-tight whitespace-normal h-auto">Comparação Mensal</TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs py-2 px-1 leading-tight whitespace-normal h-auto">Comparação Semanal</TabsTrigger>
              <TabsTrigger value="map" className="text-xs py-2 px-1 leading-tight whitespace-normal h-auto">Mapa de Clientes</TabsTrigger>
            </TabsList>

            <TabsContent value="combined" className="space-y-6">
              <CombinedMonthlyReport />
            </TabsContent>

            <TabsContent value="monthly" className="space-y-6">
              {monthlyComparison && (
                <PeriodComparison
                  title="Análise Mensal"
                  current={monthlyComparison.current}
                  previous={monthlyComparison.previous}
                  growth={monthlyComparison.growth}
                />
              )}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-6">
              {weeklyComparison && (
                <PeriodComparison
                  title="Análise Semanal"
                  current={weeklyComparison.current}
                  previous={weeklyComparison.previous}
                  growth={weeklyComparison.growth}
                />
              )}
            </TabsContent>

            <TabsContent value="map" className="space-y-6">
              <BlurredPreview
                featureName="Mapa de Clientes"
                description="Descubra de onde vêm seus melhores clientes e onde estão suas maiores oportunidades de crescimento."
                ctaText="Desbloquear"
              >
                <CustomerMap />
              </BlurredPreview>
            </TabsContent>
          </Tabs>

          {peakHours && peakHours.length > 0 && (
            <GrowthFeatureGate
              featureName="Horários de Pico"
              featureDescription="Descubra os horários mais lucrativos para otimizar sua agenda."
            >
              <PeakHoursChart data={peakHours} />
            </GrowthFeatureGate>
          )}

          {historicalData && historicalData.length > 0 && (
            <GrowthFeatureGate
              featureName="Previsão de Faturamento"
              featureDescription="Veja projeções do seu faturamento baseadas em dados históricos."
            >
              <ForecastCard historicalData={historicalData} />
            </GrowthFeatureGate>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default Relatorios;
