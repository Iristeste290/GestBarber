import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AppointmentData {
  id: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  appointment_time: string;
  barber: { name: string };
  service: { name: string; price: number };
  barber_id: string;
}

type NotificationType = 'confirmed' | 'cancelled' | 'rescheduled' | 'reminder';

const getMessageTemplate = (type: NotificationType, data: AppointmentData): string => {
  const formattedDate = format(
    new Date(data.appointment_date + 'T00:00:00'), 
    "dd/MM/yyyy", 
    { locale: ptBR }
  );
  const formattedTime = data.appointment_time.substring(0, 5);
  
  const templates: Record<NotificationType, string> = {
    confirmed: `✅ *Agendamento Confirmado!*

Olá *${data.customer_name}*!

Seu agendamento foi confirmado:

👤 Barbeiro: ${data.barber.name}
✂️ Serviço: ${data.service.name}
📅 Data: ${formattedDate}
⏰ Horário: ${formattedTime}
💰 Valor: R$ ${data.service.price?.toFixed(2)}

Aguardamos você! 😊`,

    cancelled: `❌ *Agendamento Cancelado*

Olá *${data.customer_name}*,

Infelizmente seu agendamento foi cancelado:

📅 Data: ${formattedDate}
⏰ Horário: ${formattedTime}
✂️ Serviço: ${data.service.name}

Caso queira reagendar, entre em contato conosco.`,

    rescheduled: `📅 *Agendamento Alterado*

Olá *${data.customer_name}*!

Seu agendamento foi alterado para:

👤 Barbeiro: ${data.barber.name}
✂️ Serviço: ${data.service.name}
📅 Nova Data: ${formattedDate}
⏰ Novo Horário: ${formattedTime}
💰 Valor: R$ ${data.service.price?.toFixed(2)}

Aguardamos você! 😊`,

    reminder: `⏰ *Lembrete de Agendamento*

Olá *${data.customer_name}*!

Lembrete do seu agendamento para amanhã:

👤 Barbeiro: ${data.barber.name}
✂️ Serviço: ${data.service.name}
📅 Data: ${formattedDate}
⏰ Horário: ${formattedTime}

Até lá! 😊`
  };
  
  return templates[type];
};

export const sendWhatsAppNotification = async (
  appointment: AppointmentData,
  type: NotificationType
): Promise<{ success: boolean; message?: string }> => {
  if (!appointment.customer_phone) {
    console.log("Cliente sem telefone cadastrado");
    return { success: false, message: "Cliente sem telefone cadastrado" };
  }

  try {
    const message = getMessageTemplate(type, appointment);
    
    const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        barberId: appointment.barber_id,
        phone: appointment.customer_phone,
        message,
        appointmentData: {
          nome: appointment.customer_name,
          barbeiro: appointment.barber.name,
          servico: appointment.service.name,
          data: format(new Date(appointment.appointment_date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR }),
          horario: appointment.appointment_time.substring(0, 5),
          preco: appointment.service.price?.toFixed(2)
        }
      }
    });

    if (error) {
      console.error("Erro ao enviar WhatsApp:", error);
      return { success: false, message: error.message };
    }

    if (!data?.success) {
      if (!data?.configured) {
        console.log("WhatsApp não configurado");
        return { success: false, message: "WhatsApp não configurado" };
      }
      return { success: false, message: data?.error || "Erro ao enviar mensagem" };
    }

    console.log("Mensagem WhatsApp enviada com sucesso");
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao enviar notificação WhatsApp:", error);
    return { success: false, message: error.message };
  }
};

export const useWhatsAppNotification = () => {
  const sendNotification = async (
    appointment: AppointmentData,
    type: NotificationType
  ) => {
    return sendWhatsAppNotification(appointment, type);
  };

  return { sendNotification };
};
