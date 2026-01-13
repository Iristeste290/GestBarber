import { AppLayout } from "@/components/AppLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import { PeriodComparison } from "@/components/analytics/PeriodComparison";
import { PeakHoursChart } from "@/components/analytics/PeakHoursChart";
import { ForecastCard } from "@/components/analytics/ForecastCard";
import { ExportButtons } from "@/components/analytics/ExportButtons";
import { CombinedMonthlyReport } from "@/components/analytics/CombinedMonthlyReport";
import { CustomerMap } from "@/components/analytics/CustomerMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsPageSkeleton } from "@/components/skeletons/PageSkeletons";

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
          <div className="flex justify-end">
            <ExportButtons 
              monthlyData={monthlyComparison}
              weeklyData={weeklyComparison}
              peakHours={peakHours}
            />
          </div>

          <Tabs defaultValue="combined" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="combined">Relatório Mensal</TabsTrigger>
              <TabsTrigger value="monthly">Comparação Mensal</TabsTrigger>
              <TabsTrigger value="weekly">Comparação Semanal</TabsTrigger>
              <TabsTrigger value="map">Mapa de Clientes</TabsTrigger>
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
              <CustomerMap />
            </TabsContent>
          </Tabs>

          {peakHours && peakHours.length > 0 && (
            <PeakHoursChart data={peakHours} />
          )}

          {historicalData && historicalData.length > 0 && (
            <ForecastCard historicalData={historicalData} />
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default Relatorios;
