import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Scissors, Clock, Calendar, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { openWhatsAppChat } from "@/lib/whatsapp";
import { CancellationUpsell, useCancellationUpsell } from "@/components/conversion";

interface AppointmentDetailsDialogProps {
  appointmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AppointmentDetailsDialog = ({
  appointmentId,
  open,
  onOpenChange,
}: AppointmentDetailsDialogProps) => {
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Hook para upsell de cancelamento
  const { showUpsell, customerName, triggerUpsell, closeUpsell } = useCancellationUpsell();

  useEffect(() => {
    if (open && appointmentId) {
      loadAppointment();
    }
  }, [open, appointmentId]);

  const loadAppointment = async () => {
    if (!appointmentId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          barber:barbers(name, specialty),
          service:services(name, duration_minutes, price),
          profile:profiles(full_name)
        `)
        .eq("id", appointmentId)
        .single();

      if (error) throw error;
      setAppointment(data);
    } catch (error: any) {
      toast.error("Erro ao carregar detalhes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!appointment?.customer_phone) {
      toast.error("Cliente não possui telefone cadastrado");
      return;
    }

    const customerName = appointment.customer_name || appointment.profile?.full_name || "Cliente";
    const phone = appointment.customer_phone.replace(/\D/g, "");
    const time = appointment.appointment_time.substring(0, 5);
    
    const date = new Date(appointment.appointment_date + "T00:00:00");
    const formattedDate = date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const statusText = appointment.status === "confirmed" ? "confirmado" : "agendado";

    const message = `Olá ${customerName}! 👋

Seu agendamento está ${statusText}:

📅 *${formattedDate}*
🕐 *${time}*
✂️ *${appointment.service?.name}*
💈 com *${appointment.barber?.name}*
💰 R$ ${appointment.service?.price?.toFixed(2)}

Te esperamos! 😊`;

    openWhatsAppChat({
      phoneE164Digits: `55${phone}`,
      message,
    });
    toast.success("WhatsApp aberto com a mensagem!");
  };

  const updateStatus = async (newStatus: string) => {
    if (!appointmentId) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) throw error;

      toast.success(
        newStatus === "confirmed" ? "Agendamento confirmado!" :
        newStatus === "completed" ? "Agendamento concluído!" :
        "Agendamento cancelado"
      );
      
      await loadAppointment();
      if (newStatus === "cancelled") {
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = async () => {
    const customerNameToShow = appointment?.customer_name || appointment?.profile?.full_name;
    await updateStatus("cancelled");
    setShowCancelDialog(false);
    
    // Disparar upsell de cancelamento
    triggerUpsell(customerNameToShow);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      completed: "bg-green-500/10 text-green-500 border-green-500/20",
      cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "Pendente",
      confirmed: "Confirmado",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading || !appointment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carregando</DialogTitle>
            <DialogDescription>Aguarde enquanto carregamos os detalhes...</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">Carregando...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Informações completas do agendamento selecionado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge className={getStatusColor(appointment.status)}>
                {getStatusLabel(appointment.status)}
              </Badge>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{appointment.customer_name || appointment.profile?.full_name || "Cliente não identificado"}</p>
                  {appointment.customer_phone && (
                    <p className="text-sm text-muted-foreground">{appointment.customer_phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Scissors className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Serviço</p>
                  <p className="font-medium">{appointment.service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.service.duration_minutes} min • R$ {appointment.service.price}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Barbeiro</p>
                  <p className="font-medium">{appointment.barber.name}</p>
                  {appointment.barber.specialty && (
                    <p className="text-sm text-muted-foreground">{appointment.barber.specialty}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(new Date(appointment.appointment_date + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Horário</p>
                  <p className="font-medium">{appointment.appointment_time.substring(0, 5)}</p>
                </div>
              </div>

              {appointment.notes && (
                <div className="border-t pt-3">
                  <p className="text-sm text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm">{appointment.notes}</p>
                </div>
              )}
            </div>

            {/* Botão de enviar WhatsApp */}
            {appointment.customer_phone && appointment.status !== "cancelled" && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleSendWhatsApp}
                  className="w-full gap-2 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
                  size="sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Enviar Lembrete WhatsApp
                </Button>
              </div>
            )}

            {appointment.status !== "cancelled" && appointment.status !== "completed" && (
              <div className="flex gap-2 pt-4 border-t">
                {appointment.status === "pending" && (
                  <Button
                    onClick={() => updateStatus("confirmed")}
                    disabled={actionLoading}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar
                  </Button>
                )}
                {appointment.status === "confirmed" && (
                  <Button
                    onClick={() => updateStatus("completed")}
                    disabled={actionLoading}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Concluir
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upsell modal para cancelamentos */}
      <CancellationUpsell
        isOpen={showUpsell}
        onClose={closeUpsell}
        customerName={customerName}
      />
    </>
  );
};
