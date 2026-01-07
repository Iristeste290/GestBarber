import { StatsCards } from "@/components/dashboard/StatsCards";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TopServices } from "@/components/dashboard/TopServices";
import { BarberRanking } from "@/components/dashboard/BarberRanking";
import { RevenueForecast } from "@/components/dashboard/RevenueForecast";
import { PublicAgendaCard } from "@/components/dashboard/PublicAgendaCard";
import { AppLayout } from "@/components/AppLayout";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { DashboardSkeleton } from "@/components/skeletons/PageSkeletons";
import { WhatsNewModal } from "@/components/notifications/WhatsNewModal";

const Dashboard = () => {
  const { user, loading } = useRequireAuth();
  const { profile, loading: profileLoading } = useUserProfile(user);

  return (
    <AppLayout title="Painel" description="Visão geral da barbearia">
      <WhatsNewModal />
      {loading || profileLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-4 md:space-y-6">
          {profile?.barbershop_name && (
            <div className="rounded-lg border bg-card p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold text-primary">
                Bem-vindo, {profile.barbershop_name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Aqui está o resumo do seu negócio
              </p>
            </div>
          )}
          
          <PublicAgendaCard />
          
          <StatsCards />
          
          <RevenueForecast />
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            <RevenueChart />
            <TopServices />
          </div>

          <BarberRanking />
        </div>
      )}
    </AppLayout>
  );
};

export default Dashboard;
