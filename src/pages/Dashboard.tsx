import { useEffect } from "react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TopServices } from "@/components/dashboard/TopServices";
import { BarberRanking } from "@/components/dashboard/BarberRanking";
import { RevenueForecast } from "@/components/dashboard/RevenueForecast";
import { PublicAgendaCard } from "@/components/dashboard/PublicAgendaCard";
import { LostRevenueAlert } from "@/components/dashboard/LostRevenueAlert";
import { PerformanceRanking } from "@/components/dashboard/PerformanceRanking";
import { RevenueSimulator } from "@/components/dashboard/RevenueSimulator";
import { GoogleBusinessCards } from "@/components/dashboard/GoogleBusinessCards";
import { AppLayout } from "@/components/AppLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { DashboardSkeleton } from "@/components/skeletons/PageSkeletons";
import { PremiumFeatureAnnouncements } from "@/components/notifications/PremiumFeatureAnnouncements";
import { useGrowthTriggers } from "@/components/upgrade/GrowthTriggerProvider";
import { 
  InactiveClientsAlert, 
  EmptySlotsAlert, 
  EducationalTips,
  MilestoneUpsell,
  MonthlyOpportunityCard,
  WeakWeekAlert,
  WeeklyProgressCard,
  EngagementStatsCard,
  DailyLossTracker
} from "@/components/conversion";

const Dashboard = () => {
  const { user, loading } = useRequireAuth();
  const { profile, loading: profileLoading } = useUserProfile(user);
  const { checkTriggers, isStart } = useGrowthTriggers();

  // Check triggers on dashboard load for Start plan users
  useEffect(() => {
    if (!loading && !profileLoading && isStart) {
      // Small delay to ensure dashboard is loaded
      const timer = setTimeout(() => {
        checkTriggers();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, profileLoading, isStart, checkTriggers]);

  return (
    <AppLayout title="Painel" description="Visão geral da barbearia">
      <PremiumFeatureAnnouncements />
      
      {/* Milestone celebration for Start users */}
      <MilestoneUpsell />
      
      {loading || profileLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-4 md:space-y-6">
          {profile?.barbershop_name && (
            <div className="rounded-xl border border-primary/20 bg-card p-4 md:p-6 shadow-gold">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-gold bg-clip-text text-transparent">
                Bem-vindo, {profile.barbershop_name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Controle total do seu negócio
              </p>
            </div>
          )}
          
          {/* Tracker de perdas diárias (Start only) */}
          <DailyLossTracker />
          
          {/* Card principal de oportunidade (apenas Start) */}
          <MonthlyOpportunityCard />
          
          {/* Alerta de semana fraca (Start only) */}
          <WeakWeekAlert />
          
          {/* Alerta de Dinheiro Perdido - para todos, com CTA diferente */}
          <LostRevenueAlert />
          
          {/* Alertas de conversão para usuários Start */}
          <InactiveClientsAlert />
          <EmptySlotsAlert />
          
          {/* Stats de engajamento (Growth only) */}
          <EngagementStatsCard />
          
          {/* Dica educativa */}
          <EducationalTips context="dashboard" />
          
          {/* Google Business Cards - Visibilidade Local */}
          <GoogleBusinessCards />
          
          <PublicAgendaCard />
          
          <StatsCards />
          
          <RevenueForecast />
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            <RevenueChart />
            <TopServices />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            <PerformanceRanking />
            <div className="space-y-4">
              <WeeklyProgressCard />
              <RevenueSimulator />
            </div>
          </div>

          <BarberRanking />
        </div>
      )}
    </AppLayout>
  );
};

export default Dashboard;
