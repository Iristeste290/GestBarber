import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar, Users, TrendingUp, Trophy, AlertTriangle, DollarSign, Bell, ShieldAlert, Sparkles } from "lucide-react";
import { useGrowthEngine } from "@/hooks/useGrowthEngine";
import { EmptySlotsCard } from "@/components/growth/EmptySlotsCard";
import { ProblematicClientsCard } from "@/components/growth/ProblematicClientsCard";
import { ReactivationQueueCard } from "@/components/growth/ReactivationQueueCard";
import { BarberScoreCard } from "@/components/growth/BarberScoreCard";
import { RemindersCard } from "@/components/growth/RemindersCard";
import { ActionBanner } from "@/components/growth/ActionBanner";
import { LostRevenueCard } from "@/components/growth/LostRevenueCard";
import { NoShowPredictionCard } from "@/components/growth/NoShowPredictionCard";
import { DynamicPricingCard } from "@/components/growth/DynamicPricingCard";
import { GrowthEngineSkeleton } from "@/components/skeletons/PageSkeletons";
import { GrowthFeatureGate } from "@/components/growth/GrowthFeatureGate";
import { useIsDemo } from "@/hooks/useIsDemo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const GrowthEngine = () => {
  const { loading } = useRequireAuth();
  const [activeTab, setActiveTab] = useState("empty-slots");
  const isDemo = useIsDemo();
  const { 
    emptySlots, 
    problematicClients, 
    reactivationQueue, 
    barberScores,
    pendingReminders,
    syncGrowthEngine,
    markReminderSent
  } = useGrowthEngine();

  // Fetch reminder template
  const { data: reminderTemplate } = useQuery({
    queryKey: ["reminder-template"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("reminder_template")
        .eq("id", user.id)
        .single();

      return profile?.reminder_template || null;
    },
  });

  // Fetch upcoming appointments for no-show prediction
  const { data: upcomingAppointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["upcoming-appointments-for-prediction"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: barbers } = await supabase
        .from("barbers")
        .select("id, name")
        .eq("user_id", user.id);

      if (!barbers || barbers.length === 0) return [];

      const barberMap = new Map(barbers.map(b => [b.id, b.name]));

      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const { data: appointments } = await supabase
        .from("appointments")
        .select(`
          id, customer_name, customer_phone, appointment_date, appointment_time, status, barber_id,
          services!appointments_service_id_fkey(name)
        `)
        .in("barber_id", barbers.map(b => b.id))
        .gte("appointment_date", today)
        .lte("appointment_date", nextWeek)
        .in("status", ["pending", "confirmed"])
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      return (appointments || []).map(apt => ({
        id: apt.id,
        customer_name: apt.customer_name,
        customer_phone: apt.customer_phone,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        status: apt.status,
        barber_name: barberMap.get(apt.barber_id) || "Barbeiro",
        service_name: (apt.services as any)?.name || "Serviço"
      }));
    },
  });

  if (loading) {
    return (
      <AppLayout title="Growth Engine" description="Sistema de Crescimento Automático">
        <GrowthEngineSkeleton />
      </AppLayout>
    );
  }

  const isLoading = emptySlots.isLoading || problematicClients.isLoading || 
                    reactivationQueue.isLoading || barberScores.isLoading || pendingReminders.isLoading;

  const blockedClientsCount = problematicClients.data?.filter(c => c.classification === "bloqueado").length || 0;
  const pendingRemindersCount = pendingReminders.data?.filter(r => !r.reminder_sent).length || 0;

  return (
    <AppLayout 
      title="Growth Engine" 
      description="Ganhe mais dinheiro hoje"
    >
      <GrowthFeatureGate 
        featureName="Growth Engine"
        featureDescription="O Growth Engine analisa sua barbearia em tempo real e mostra exatamente o que fazer para ganhar mais dinheiro hoje."
      >
        <div className="space-y-6">
          {/* Action Banner - hidden for demo */}
          {!isDemo && (
            <ActionBanner
              emptySlotsCount={emptySlots.data?.length || 0}
              reactivationCount={reactivationQueue.data?.length || 0}
              blockedCount={blockedClientsCount}
              pendingRemindersCount={pendingRemindersCount}
              onNavigate={setActiveTab}
            />
          )}

          {/* Header with Sync Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-green-500" />
                Painel de Oportunidades
              </h2>
              <p className="text-muted-foreground">
                Todo número aqui é dinheiro esperando para entrar no seu caixa.
              </p>
            </div>
            <Button 
              onClick={() => syncGrowthEngine.mutate()}
              disabled={syncGrowthEngine.isPending}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncGrowthEngine.isPending ? "animate-spin" : ""}`} />
              Atualizar Dados
            </Button>
          </div>

          {/* Stats Overview - Clickable */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard 
              icon={Bell} 
              label="Lembretes Pendentes" 
              value={pendingRemindersCount}
              color="text-yellow-500"
              bgColor="bg-yellow-100"
              onClick={() => setActiveTab("reminders")}
              isActive={activeTab === "reminders"}
              actionLabel="Enviar"
              highlight={pendingRemindersCount > 0}
            />
            <StatCard 
              icon={Calendar} 
              label="Horários Vazios" 
              value={emptySlots.data?.length || 0}
              color="text-orange-500"
              bgColor="bg-orange-100"
              onClick={() => setActiveTab("empty-slots")}
              isActive={activeTab === "empty-slots"}
              actionLabel="Preencher"
            />
            <StatCard 
              icon={Users} 
              label="Clientes Sumidos" 
              value={reactivationQueue.data?.length || 0}
              color="text-blue-500"
              bgColor="bg-blue-100"
              onClick={() => setActiveTab("reactivation")}
              isActive={activeTab === "reactivation"}
              actionLabel="Reativar"
            />
            <StatCard 
              icon={AlertTriangle} 
              label="Problemáticos" 
              value={problematicClients.data?.length || 0}
              color="text-red-500"
              bgColor="bg-red-100"
              onClick={() => setActiveTab("problematic")}
              isActive={activeTab === "problematic"}
              actionLabel="Resolver"
            />
            <StatCard 
              icon={Trophy} 
              label="Barbeiros" 
              value={barberScores.data?.length || 0}
              color="text-green-500"
              bgColor="bg-green-100"
              onClick={() => setActiveTab("ranking")}
              isActive={activeTab === "ranking"}
              actionLabel="Ver Ranking"
            />
          </div>

          {/* Tabs for each system */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 h-auto">
              <TabsTrigger value="reminders" className="gap-2 py-3">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Lembretes</span>
                {pendingRemindersCount > 0 && (
                  <span className="ml-1 text-xs bg-yellow-500 text-white rounded-full px-1.5 py-0.5">
                    {pendingRemindersCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="empty-slots" className="gap-2 py-3">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Horários</span>
                {(emptySlots.data?.length || 0) > 0 && (
                  <span className="ml-1 text-xs bg-orange-500 text-white rounded-full px-1.5 py-0.5">
                    {emptySlots.data?.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="reactivation" className="gap-2 py-3">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Reativar</span>
                {(reactivationQueue.data?.length || 0) > 0 && (
                  <span className="ml-1 text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5">
                    {reactivationQueue.data?.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="problematic" className="gap-2 py-3">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Problemáticos</span>
                {blockedClientsCount > 0 && (
                  <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">
                    {blockedClientsCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="ranking" className="gap-2 py-3">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Ranking</span>
              </TabsTrigger>
              <TabsTrigger value="no-show" className="gap-2 py-3">
                <ShieldAlert className="h-4 w-4" />
                <span className="hidden sm:inline">No-Show</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="gap-2 py-3">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Preços</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reminders" className="mt-4">
              <RemindersCard 
                reminders={pendingReminders.data || []} 
                isLoading={isLoading}
                onMarkAsSent={(id) => markReminderSent.mutate(id)}
              />
            </TabsContent>

            <TabsContent value="empty-slots" className="mt-4">
              <EmptySlotsCard 
                slots={emptySlots.data || []} 
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="reactivation" className="mt-4">
              <ReactivationQueueCard 
                clients={reactivationQueue.data || []} 
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="problematic" className="mt-4">
              <ProblematicClientsCard 
                clients={problematicClients.data || []} 
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="ranking" className="mt-4">
              <BarberScoreCard 
                scores={barberScores.data || []} 
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="no-show" className="mt-4">
              <NoShowPredictionCard 
                appointments={upcomingAppointments}
                isLoading={appointmentsLoading}
                reminderTemplate={reminderTemplate}
              />
            </TabsContent>

            <TabsContent value="pricing" className="mt-4">
              <DynamicPricingCard />
            </TabsContent>
          </Tabs>
        </div>
      </GrowthFeatureGate>
    </AppLayout>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  onClick: () => void;
  isActive: boolean;
  actionLabel: string;
  highlight?: boolean;
}

const StatCard = ({ icon: Icon, label, value, color, bgColor, onClick, isActive, actionLabel, highlight }: StatCardProps) => (
  <button
    onClick={onClick}
    className={`rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md hover:scale-[1.02] ${
      isActive ? "ring-2 ring-primary shadow-md" : ""
    } ${value > 0 ? "cursor-pointer" : ""} ${highlight && value > 0 ? "ring-2 ring-yellow-400 animate-pulse" : ""}`}
  >
    <div className="flex items-center gap-3">
      <div className={`rounded-full p-2.5 ${bgColor} ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className={`text-2xl font-bold ${value > 0 ? color : ""}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
    {value > 0 && (
      <p className={`text-xs mt-2 font-medium ${color}`}>
        → {actionLabel}
      </p>
    )}
  </button>
);

export default GrowthEngine;
