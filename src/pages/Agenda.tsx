import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, MessageSquare, Sparkles, AlertTriangle, Crown, Calendar, Send, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/AppLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAgenda } from "@/hooks/useAgenda";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { handleError } from "@/lib/error-handler";
import { createProgressToast } from "@/lib/progress-toast";
import { openWhatsAppChat, formatReminderMessage } from "@/lib/whatsapp";
import { AgendaSkeleton } from "@/components/skeletons/PageSkeletons";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGrowthTriggers } from "@/components/upgrade/GrowthTriggerProvider";
import { EducationalTips } from "@/components/conversion";

// New components
import { AgendaHeader } from "@/components/agenda/AgendaHeader";
import { AgendaDateChips } from "@/components/agenda/AgendaDateChips";
import { AgendaAppointmentCard } from "@/components/agenda/AgendaAppointmentCard";
import { AgendaFiltersSheet } from "@/components/agenda/AgendaFiltersSheet";
import { AgendaEmptyState } from "@/components/agenda/AgendaEmptyState";
import { AgendaLoadingSkeleton } from "@/components/agenda/AgendaLoadingSkeleton";

// Existing components
import { NewAppointmentDialog } from "@/components/agenda/NewAppointmentDialog";
import { AppointmentDetailsDialog } from "@/components/agenda/AppointmentDetailsDialog";
import { WhatsAppIntegration } from "@/components/whatsapp/WhatsAppIntegration";

const Agenda = () => {
  const { loading: authLoading, user } = useRequireAuth();
  const { userPlan, isFreemium } = usePlanValidation();
  const { metrics, isStart, checkTriggers } = useGrowthTriggers();
  const navigate = useNavigate();
  
  // State
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"day" | "tomorrow" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedBarber, setSelectedBarber] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [appointmentsUsedThisMonth, setAppointmentsUsedThisMonth] = useState<number | null>(null);
  const [reminderTemplate, setReminderTemplate] = useState<string | null>(null);

  // Use the agenda hook
  const { 
    groupedAppointments, 
    appointments,
    loading: appointmentsLoading, 
    updateStatus,
    refresh: refreshAppointments,
  } = useAgenda({
    viewMode,
    selectedDate,
    selectedBarber,
    selectedService,
    selectedStatus,
  });

  // Fetch appointments count and reminder template
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch reminder template
      const { data: profileData } = await supabase
        .from('profiles')
        .select('reminder_template')
        .eq('id', user.id)
        .single();
      
      if (profileData?.reminder_template) {
        setReminderTemplate(profileData.reminder_template);
      }

      // Fetch freemium appointments count
      if (!isFreemium) return;

      const { data: barbers } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user.id);

      if (!barbers || barbers.length === 0) {
        setAppointmentsUsedThisMonth(0);
        return;
      }

      const barberIds = barbers.map(b => b.id);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .in('barber_id', barberIds)
        .gte('appointment_date', startOfMonth.toISOString().split('T')[0]);

      setAppointmentsUsedThisMonth(count || 0);
    };

    fetchData();
  }, [user, isFreemium, appointments]);

  const handleOptimizeSchedule = async () => {
    if (appointments.length === 0) {
      toast.info("Sem agendamentos para otimizar", {
        description: "Adicione alguns agendamentos primeiro."
      });
      return;
    }

    setIsOptimizing(true);
    const progress = createProgressToast();
    progress.start({ title: "Otimizando agenda com IA..." });
    
    try {
      const { data, error } = await supabase.functions.invoke("optimize-schedule", {
        body: { 
          date: format(new Date(), "yyyy-MM-dd"),
          appointments: appointments.map(a => ({
            id: a.id,
            time: a.appointment_time,
            date: a.appointment_date,
            barber: a.barber?.name,
            service: a.service?.name,
            duration: a.service?.duration_minutes,
            status: a.status
          }))
        },
      });
      
      if (error) throw error;
      
      progress.success(data?.message || "Análise concluída! Veja as sugestões de otimização.");
      
      // Show AI suggestions in a toast
      if (data?.result) {
        toast.info("Sugestões da IA", {
          description: "A IA analisou sua agenda e gerou recomendações de otimização.",
          duration: 5000
        });
      }
    } catch (error: any) {
      progress.error("Erro ao otimizar agenda");
      handleError(error, { title: "Erro ao otimizar agenda" });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleViewModeChange = (mode: "day" | "tomorrow" | "week" | "month") => {
    setViewMode(mode);
    // Reset date to today when changing view mode
    if (mode === "day") {
      setSelectedDate(new Date());
    }
  };

  const handleStatusChange = (appointmentId: string, status: string) => {
    updateStatus(appointmentId, status);
  };

  // Get appointments that need reminders (pending/confirmed with phone)
  const appointmentsForReminder = appointments.filter(
    (a) => 
      (a.status === "pending" || a.status === "confirmed") && 
      a.customer_phone
  );

  const handleSendAllReminders = () => {
    if (appointmentsForReminder.length === 0) {
      toast.info("Nenhum agendamento para enviar lembrete", {
        description: "Não há agendamentos pendentes/confirmados com telefone cadastrado."
      });
      return;
    }

    toast.info(`Abrindo ${appointmentsForReminder.length} conversas...`, {
      description: "Aguarde, as abas serão abertas uma a uma."
    });

    // Open WhatsApp windows with small delay to avoid popup blocker
    appointmentsForReminder.forEach((appointment, index) => {
      setTimeout(() => {
        const customerName = appointment.customer_name || appointment.profile?.full_name || "Cliente";
        const time = appointment.appointment_time.substring(0, 5);
        const phone = appointment.customer_phone!.replace(/\D/g, "");
        
        const date = new Date(appointment.appointment_date + "T00:00:00");
        const formattedDate = date.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

        const message = formatReminderMessage(reminderTemplate, {
          customerName,
          formattedDate,
          time,
          serviceName: appointment.service?.name || "Serviço",
          barberName: appointment.barber?.name || "Barbeiro",
        });

        openWhatsAppChat({
          phoneE164Digits: `55${phone}`,
          message,
        });

        // Show success toast on last one
        if (index === appointmentsForReminder.length - 1) {
          setTimeout(() => {
            toast.success(`${appointmentsForReminder.length} conversas abertas!`, {
              description: "Envie a mensagem em cada aba."
            });
          }, 500);
        }
      }, index * 800); // 800ms delay between each
    });
  };

  // Calculate total appointments
  const totalAppointments = appointments.length;

  // Calculate empty slots for banner
  const emptySlots = metrics ? metrics.dailySlotsTotal - metrics.dailySlotsFilled : 0;
  const lostMoney = metrics ? Math.round(emptySlots * metrics.avgTicket) : 0;

  return (
    <AppLayout title="Agenda" description="Gerencie seus agendamentos">
      {authLoading ? (
        <AgendaSkeleton />
      ) : (
        <div className="space-y-4 md:space-y-6 pb-24 sm:pb-6">
          {/* Banner Growth Engine - Horários vazios (apenas para plano Start) */}
          {isStart && emptySlots > 3 && lostMoney > 50 && (
            <Alert className="border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <Clock className="h-4 w-4 text-amber-500" />
              <AlertTitle className="flex items-center gap-2 text-amber-600">
                <span>Você tem {emptySlots} horários vazios hoje</span>
              </AlertTitle>
              <AlertDescription className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Isso representa aproximadamente <strong className="text-amber-600">R$ {lostMoney}</strong> que você deixa de ganhar. 
                  O Growth Engine preenche automaticamente esses horários.
                </p>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/planos')}
                  className="bg-gradient-to-r from-[#C9B27C] to-[#E5D4A1] hover:from-[#D4BD87] hover:to-[#F0DFA9] text-black"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Ativar Growth Engine
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Alerta de limite de agendamentos para Freemium */}
          {isFreemium && appointmentsUsedThisMonth !== null && userPlan && (
            (() => {
              const maxAppointments = userPlan.limits.maxAppointmentsPerMonth;
              const percentUsed = (appointmentsUsedThisMonth / maxAppointments) * 100;
              const remaining = maxAppointments - appointmentsUsedThisMonth;
              
              if (percentUsed >= 70) {
                const isNearLimit = percentUsed >= 90;
                const isAtLimit = appointmentsUsedThisMonth >= maxAppointments;
                
                return (
                  <Alert variant={isAtLimit ? "destructive" : "default"} className={isNearLimit && !isAtLimit ? "border-amber-500 bg-amber-500/10" : ""}>
                    <AlertTriangle className={`h-4 w-4 ${isAtLimit ? '' : isNearLimit ? 'text-amber-500' : ''}`} />
                    <AlertTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {isAtLimit 
                        ? 'Limite de agendamentos atingido!' 
                        : isNearLimit 
                          ? 'Limite quase atingido!' 
                          : 'Atenção ao limite'
                      }
                    </AlertTitle>
                    <AlertDescription className="space-y-3">
                      <p className="text-sm">
                        {isAtLimit 
                          ? `Você usou todos os ${maxAppointments} agendamentos do mês.`
                          : `${appointmentsUsedThisMonth}/${maxAppointments} usados. Restam ${remaining}.`
                        }
                      </p>
                      <Progress value={Math.min(percentUsed, 100)} className="h-2" />
                      <Button 
                        size="sm" 
                        onClick={() => navigate('/planos')}
                        className={isAtLimit ? "" : "bg-amber-500 hover:bg-amber-600"}
                      >
                        <Crown className="h-4 w-4 mr-1" />
                        Upgrade
                      </Button>
                    </AlertDescription>
                  </Alert>
                );
              }
              return null;
            })()
          )}

          {/* Dica educativa */}
          <EducationalTips context="agenda" />

          {/* Header with date and new appointment button */}
          <AgendaHeader
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            appointmentCount={totalAppointments}
            onNewAppointment={() => setIsNewAppointmentOpen(true)}
          />

          {/* Navigation chips and filters row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <AgendaDateChips 
              viewMode={viewMode} 
              onViewModeChange={handleViewModeChange}
            />
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Send all reminders button */}
              {appointmentsForReminder.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSendAllReminders}
                  className="gap-2 text-xs sm:text-sm border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Lembrete p/ Todos ({appointmentsForReminder.length})</span>
                  <span className="sm:hidden">Todos ({appointmentsForReminder.length})</span>
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleOptimizeSchedule}
                disabled={isOptimizing}
                className="gap-2 text-xs sm:text-sm"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">{isOptimizing ? "Otimizando..." : "IA Inteligente"}</span>
                <span className="sm:hidden">{isOptimizing ? "..." : "IA"}</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsWhatsAppDialogOpen(true)}
                className="gap-2 text-xs sm:text-sm"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp IA</span>
              </Button>
              
              <AgendaFiltersSheet
                selectedBarber={selectedBarber}
                onBarberChange={setSelectedBarber}
                selectedService={selectedService}
                onServiceChange={setSelectedService}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
              />
            </div>
          </div>

          {/* Appointments list */}
          {appointmentsLoading ? (
            <AgendaLoadingSkeleton />
          ) : totalAppointments === 0 ? (
            <AgendaEmptyState 
              viewMode={viewMode}
              onNewAppointment={() => setIsNewAppointmentOpen(true)} 
            />
          ) : (
            <div className="space-y-6 animate-fade-in">
              {Object.entries(groupedAppointments).map(([date, dayAppointments]) => (
                <div key={date} className="space-y-3">
                  {/* Date header - only show if week/month view */}
                  {(viewMode === "week" || viewMode === "month") && (
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
                      {format(new Date(date + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </h3>
                  )}
                  
                  {/* Appointment cards */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {dayAppointments.map((appointment) => (
                      <AgendaAppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onClick={() => setSelectedAppointmentId(appointment.id)}
                        onStatusChange={(status) => handleStatusChange(appointment.id, status)}
                        onRefresh={refreshAppointments}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating action button for mobile */}
      <Button
        onClick={() => setIsNewAppointmentOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl sm:hidden z-50 p-0"
        aria-label="Novo agendamento"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Dialogs */}
      <NewAppointmentDialog
        open={isNewAppointmentOpen}
        onOpenChange={setIsNewAppointmentOpen}
      />

      <AppointmentDetailsDialog
        appointmentId={selectedAppointmentId}
        open={!!selectedAppointmentId}
        onOpenChange={(open) => !open && setSelectedAppointmentId(null)}
      />

      <Dialog open={isWhatsAppDialogOpen} onOpenChange={setIsWhatsAppDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Agendamento via WhatsApp com IA</DialogTitle>
            <DialogDescription>
              Configure e teste o sistema de agendamentos automáticos via WhatsApp
            </DialogDescription>
          </DialogHeader>
          <WhatsAppIntegration />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Agenda;
