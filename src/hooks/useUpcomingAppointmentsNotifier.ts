import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes, isWithinInterval } from "date-fns";
import { playNotificationSound, playUrgentNotificationSound } from "@/lib/notification-sound";

// Helper function to trigger push notification via edge function
async function sendPushNotification(userId: string, title: string, body: string, data?: Record<string, unknown>) {
  try {
    await supabase.functions.invoke("send-push-notification", {
      body: { userId, title, body, data },
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

interface UpcomingAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  customer_name: string;
  barber_name: string;
  service_name: string;
}

export const useUpcomingAppointmentsNotifier = (userId?: string) => {
  const queryClient = useQueryClient();
  const notifiedAppointments = useRef<Set<string>>(new Set());

  // Buscar agendamentos de hoje
  const { data: todayAppointments = [] } = useQuery({
    queryKey: ["upcoming-appointments", userId],
    queryFn: async () => {
      if (!userId) return [];

      const today = format(new Date(), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          appointment_time,
          customer_name,
          barbers!appointments_barber_id_fkey (name),
          services!appointments_service_id_fkey (name)
        `)
        .eq("appointment_date", today)
        .in("status", ["pending", "confirmed"])
        .order("appointment_time");

      if (error) throw error;

      return (data || []).map((apt: any) => ({
        id: apt.id,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        customer_name: apt.customer_name || "Cliente",
        barber_name: apt.barbers?.name || "Barbeiro",
        service_name: apt.services?.name || "Serviço",
      }));
    },
    enabled: !!userId,
    refetchInterval: 60000, // Refetch every minute
  });

  // Verificar agendamentos próximos e criar notificações
  useEffect(() => {
    if (!userId || !todayAppointments.length) return;

    const checkUpcomingAppointments = async () => {
      const now = new Date();

      for (const apt of todayAppointments) {
        // Parse appointment time
        const [hours, minutes] = apt.appointment_time.split(":").map(Number);
        const appointmentDateTime = new Date();
        appointmentDateTime.setHours(hours, minutes, 0, 0);

        // Check if appointment is within next 15 minutes
        const fifteenMinutesFromNow = addMinutes(now, 15);
        const fiveMinutesAgo = addMinutes(now, -5);

        const isUpcoming = isWithinInterval(appointmentDateTime, {
          start: now,
          end: fifteenMinutesFromNow,
        });

        const notificationKey = `${apt.id}-15min`;

        if (isUpcoming && !notifiedAppointments.current.has(notificationKey)) {
          // Calculate minutes until appointment
          const minutesUntil = Math.round(
            (appointmentDateTime.getTime() - now.getTime()) / 60000
          );

          // Create notification
          await supabase.from("notifications").insert({
            user_id: userId,
            title: "⏰ Agendamento em breve!",
            message: `${apt.customer_name} - ${apt.service_name} com ${apt.barber_name} em ${minutesUntil} minutos (${apt.appointment_time.slice(0, 5)})`,
            type: "appointment",
            link: "/agenda",
          });

          // Play gentle notification sound (for when app is open)
          playNotificationSound('gentle');
          
          // Send push notification (for when app is closed)
          sendPushNotification(
            userId,
            "⏰ Agendamento em breve!",
            `${apt.customer_name} - ${apt.service_name} em ${minutesUntil} minutos`,
            { appointmentId: apt.id }
          );

          notifiedAppointments.current.add(notificationKey);
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }

        // Check if appointment is starting now (within 2 minutes)
        const twoMinutesFromNow = addMinutes(now, 2);
        const isStartingNow = isWithinInterval(appointmentDateTime, {
          start: fiveMinutesAgo,
          end: twoMinutesFromNow,
        });

        const startingNowKey = `${apt.id}-now`;

        if (isStartingNow && !notifiedAppointments.current.has(startingNowKey)) {
          await supabase.from("notifications").insert({
            user_id: userId,
            title: "🔔 Agendamento agora!",
            message: `${apt.customer_name} chegando para ${apt.service_name} com ${apt.barber_name}`,
            type: "appointment",
            link: "/agenda",
          });

          // Play urgent notification sound (double chime)
          playUrgentNotificationSound();
          
          // Send push notification
          sendPushNotification(
            userId,
            "🔔 Agendamento agora!",
            `${apt.customer_name} chegando para ${apt.service_name}`,
            { appointmentId: apt.id, urgent: true }
          );

          notifiedAppointments.current.add(startingNowKey);
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      }
    };

    // Check immediately
    checkUpcomingAppointments();

    // Check every minute
    const interval = setInterval(checkUpcomingAppointments, 60000);

    return () => clearInterval(interval);
  }, [userId, todayAppointments, queryClient]);

  return { todayAppointments };
};
