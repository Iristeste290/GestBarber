import { useState, useEffect } from "react";
import { Clock, User, Scissors, Check, X, Edit2, MoreVertical, UserX, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { openWhatsAppChat, formatReminderMessage } from "@/lib/whatsapp";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string;
  customer_name: string | null;
  customer_phone: string | null;
  barber: { name: string };
  service: { name: string; duration_minutes: number };
  profile: { full_name: string } | null;
}

interface AgendaAppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
  onStatusChange?: (status: string) => void;
}

const statusConfig = {
  pending: {
    label: "Pendente",
    bgClass: "bg-amber-500/10 border-amber-500/30",
    textClass: "text-amber-600 dark:text-amber-400",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    accentClass: "border-l-amber-500",
  },
  confirmed: {
    label: "Confirmado",
    bgClass: "bg-emerald-500/10 border-emerald-500/30",
    textClass: "text-emerald-600 dark:text-emerald-400",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    accentClass: "border-l-emerald-500",
  },
  completed: {
    label: "Concluído",
    bgClass: "bg-blue-500/10 border-blue-500/30",
    textClass: "text-blue-600 dark:text-blue-400",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    accentClass: "border-l-blue-500",
  },
  cancelled: {
    label: "Cancelado",
    bgClass: "bg-slate-500/10 border-slate-500/30",
    textClass: "text-slate-500",
    badgeClass: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    accentClass: "border-l-slate-400",
  },
  no_show: {
    label: "Não compareceu",
    bgClass: "bg-orange-500/10 border-orange-500/30",
    textClass: "text-orange-600 dark:text-orange-400",
    badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    accentClass: "border-l-orange-500",
  },
  late: {
    label: "Atrasado",
    bgClass: "bg-red-500/10 border-red-500/30",
    textClass: "text-red-600 dark:text-red-400",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    accentClass: "border-l-red-500",
  },
};

export const AgendaAppointmentCard = ({
  appointment,
  onClick,
  onStatusChange,
}: AgendaAppointmentCardProps) => {
  const [reminderTemplate, setReminderTemplate] = useState<string | null>(null);
  const config = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.pending;
  const customerName = appointment.customer_name || appointment.profile?.full_name || "Cliente";
  const time = appointment.appointment_time.substring(0, 5);

  // Fetch reminder template on mount
  useEffect(() => {
    const fetchTemplate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("reminder_template")
        .eq("id", user.id)
        .single();
      
      if (data?.reminder_template) {
        setReminderTemplate(data.reminder_template);
      }
    };
    fetchTemplate();
  }, []);

  const handleQuickAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(action);
    }
  };

  const handleSendWhatsAppReminder = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const phone = appointment.customer_phone;
    if (!phone) {
      toast.error("Cliente não possui telefone cadastrado");
      return;
    }

    // Clean phone number - remove non-digits
    const cleanPhone = phone.replace(/\D/g, "");
    
    // Format date
    const date = new Date(appointment.appointment_date + "T00:00:00");
    const formattedDate = date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    
    // Build reminder message using template
    const message = formatReminderMessage(reminderTemplate, {
      customerName,
      formattedDate,
      time,
      serviceName: appointment.service.name,
      barberName: appointment.barber.name,
    });

    openWhatsAppChat({
      phoneE164Digits: `55${cleanPhone}`,
      message,
    });
    toast.success("WhatsApp aberto com a mensagem!");
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer rounded-xl border-l-4 bg-card p-4 shadow-sm transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        "active:scale-[0.99]",
        config.accentClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Time and status */}
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tight tabular-nums">
              {time}
            </span>
            <Badge 
              variant="secondary" 
              className={cn("text-xs font-medium", config.badgeClass)}
            >
              {config.label}
            </Badge>
          </div>

          {/* Customer name */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{customerName}</span>
          </div>

          {/* Service */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Scissors className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{appointment.service.name}</span>
            <span className="text-xs">•</span>
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-xs">{appointment.service.duration_minutes}min</span>
          </div>

          {/* Barber */}
          <p className="text-xs text-muted-foreground">
            com <span className="font-medium text-foreground/80">{appointment.barber.name}</span>
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => handleSendWhatsAppReminder(e as any)}>
                <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                Enviar Lembrete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleQuickAction(e as any, "confirmed")}>
                <Check className="h-4 w-4 mr-2 text-emerald-500" />
                Confirmar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleQuickAction(e as any, "completed")}>
                <Check className="h-4 w-4 mr-2 text-blue-500" />
                Concluir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleQuickAction(e as any, "no_show")}>
                <UserX className="h-4 w-4 mr-2 text-orange-500" />
                Não compareceu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleQuickAction(e as any, "cancelled")}>
                <X className="h-4 w-4 mr-2 text-red-500" />
                Cancelar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onClick}>
                <Edit2 className="h-4 w-4 mr-2" />
                Detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile quick actions - always visible */}
      <div className="flex flex-wrap gap-2 mt-3 sm:hidden">
        {/* WhatsApp reminder button - always visible for pending/confirmed */}
        {(appointment.status === "pending" || appointment.status === "confirmed") && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
            onClick={handleSendWhatsAppReminder}
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1" />
            Lembrete
          </Button>
        )}
        {appointment.status === "pending" && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
            onClick={(e) => handleQuickAction(e, "confirmed")}
          >
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Confirmar
          </Button>
        )}
        {appointment.status === "confirmed" && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
              onClick={(e) => handleQuickAction(e, "completed")}
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Concluir
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
              onClick={(e) => handleQuickAction(e, "no_show")}
            >
              <UserX className="h-3.5 w-3.5 mr-1" />
              No-show
            </Button>
          </>
        )}
        {(appointment.status === "pending" || appointment.status === "confirmed") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-xs text-muted-foreground"
            onClick={(e) => handleQuickAction(e, "cancelled")}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
};
