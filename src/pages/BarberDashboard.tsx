import { AppLayout } from "@/components/AppLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { useBarberStats } from "@/hooks/useBarberStats";
import { BarberGoals } from "@/components/barber/BarberGoals";
import { BarberAppointments } from "@/components/barber/BarberAppointments";
import { BarberCommissions } from "@/components/barber/BarberCommissions";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const BarberDashboard = () => {
  const { user, loading: authLoading } = useRequireAuth("/barber-auth");
  const navigate = useNavigate();

  const { data: barberData, isLoading: loadingBarberData } = useQuery({
    queryKey: ['barber-user', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role !== 'barber') {
        navigate('/');
        return null;
      }

      const { data: barber } = await supabase
        .from('barbers')
        .select('*')
        .limit(1)
        .single();

      return barber;
    },
    enabled: !!user,
  });

  const {
    goals,
    loadingGoals,
    todayAppointments,
    loadingAppointments,
    monthCommissions,
    loadingCommissions,
  } = useBarberStats(barberData?.id || '');

  if (authLoading || loadingBarberData) {
    return <FullPageLoader text="Carregando dashboard do barbeiro..." />;
  }

  if (!barberData) return null;

  return (
    <AppLayout title="Meu Dashboard" description={`Bem-vindo, ${barberData.name}`}>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {barberData.avatar_url && (
                <img src={barberData.avatar_url} alt={barberData.name} className="h-16 w-16 rounded-full object-cover" />
              )}
              <div>
                <h2 className="text-2xl font-bold">{barberData.name}</h2>
                {barberData.specialty && <p className="text-muted-foreground">{barberData.specialty}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {!loadingCommissions && monthCommissions && <BarberCommissions commissions={monthCommissions} />}

        <div className="grid gap-6 md:grid-cols-2">
          {!loadingGoals && <BarberGoals goals={goals} />}
          {!loadingAppointments && <BarberAppointments appointments={todayAppointments} />}
        </div>
      </div>
    </AppLayout>
  );
};

export default BarberDashboard;
