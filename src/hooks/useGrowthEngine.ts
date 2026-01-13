import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import type { PendingReminder } from "@/components/growth/RemindersCard";

// Types
export interface EmptySlot {
  id: string;
  user_id: string;
  barber_id: string;
  slot_date: string;
  slot_time: string;
  status: "open" | "notified" | "filled";
  barber?: { name: string };
}

export interface ClientBehavior {
  id: string;
  client_id: string;
  user_id: string;
  client_name: string | null;
  client_phone: string | null;
  total_appointments: number;
  completed: number;
  canceled: number;
  no_show: number;
  cancel_rate: number;
  classification: "normal" | "risco" | "bloqueado";
  last_appointment_date: string | null;
}

export interface ReactivationClient {
  id: string;
  client_id: string;
  user_id: string;
  client_name: string | null;
  client_phone: string | null;
  days_inactive: number;
  last_appointment_date: string | null;
  status: "pending" | "sent" | "returned";
}

export interface BarberScore {
  id: string;
  barber_id: string;
  user_id: string;
  total_appointments: number;
  completed_appointments: number;
  revenue: number;
  no_show_clients: number;
  canceled_appointments: number;
  cancel_rate: number;
  score: number;
  barber?: { name: string; avatar_url: string | null };
}

export interface MoneyLostAlert {
  id: string;
  user_id: string;
  alert_date: string;
  empty_slots_count: number;
  cancellations_count: number;
  no_shows_count: number;
  estimated_loss: number;
  cancel_rate: number;
  is_critical: boolean;
  is_dismissed: boolean;
}

export const useGrowthEngine = () => {
  const queryClient = useQueryClient();

  // 1️⃣ Empty Slots
  const emptySlots = useQuery({
    queryKey: ["empty-slots"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("empty_slots")
        .select("*, barber:barbers(name)")
        .eq("slot_date", today)
        .eq("status", "open")
        .order("slot_time");
      
      if (error) throw error;
      return data as EmptySlot[];
    },
  });

  // 2️⃣ Client Behavior
  const clientBehavior = useQuery({
    queryKey: ["client-behavior"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_behavior")
        .select("*")
        .order("cancel_rate", { ascending: false });
      
      if (error) throw error;
      return data as ClientBehavior[];
    },
  });

  const problematicClients = useQuery({
    queryKey: ["problematic-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_behavior")
        .select("*")
        .in("classification", ["risco", "bloqueado"])
        .order("cancel_rate", { ascending: false });
      
      if (error) throw error;
      return data as ClientBehavior[];
    },
  });

  // 3️⃣ Reactivation Queue
  const reactivationQueue = useQuery({
    queryKey: ["reactivation-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reactivation_queue")
        .select("*")
        .eq("status", "pending")
        .order("days_inactive", { ascending: false });
      
      if (error) throw error;
      return data as ReactivationClient[];
    },
  });

  const markAsSent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reactivation_queue")
        .update({ status: "sent", updated_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reactivation-queue"] });
      toast.success("Cliente marcado como contactado");
    },
  });

  // 4️⃣ Barber Score
  const barberScores = useQuery({
    queryKey: ["barber-scores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barber_score")
        .select("*, barber:barbers(name, avatar_url)")
        .order("score", { ascending: false });
      
      if (error) throw error;
      return data as BarberScore[];
    },
  });

  // 5️⃣ Money Lost Alerts
  const moneyLostAlert = useQuery({
    queryKey: ["money-lost-alert"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("money_lost_alerts")
        .select("*")
        .eq("alert_date", today)
        .eq("is_dismissed", false)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data as MoneyLostAlert | null;
    },
  });

  const dismissAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("money_lost_alerts")
        .update({ is_dismissed: true })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["money-lost-alert"] });
    },
  });

  // Active clients for messaging
  const activeClients = useQuery({
    queryKey: ["active-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_behavior")
        .select("*")
        .eq("classification", "normal")
        .not("client_phone", "is", null)
        .order("last_appointment_date", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ClientBehavior[];
    },
  });

  // 6️⃣ Pending Reminders - Appointments in next 24h without reminder sent
  const pendingReminders = useQuery({
    queryKey: ["pending-reminders"],
    queryFn: async () => {
      const now = new Date();
      const today = format(now, "yyyy-MM-dd");
      const tomorrow = format(addDays(now, 1), "yyyy-MM-dd");
      
      // Get user profile for barbershop name
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("barbershop_name")
        .eq("id", userData.user.id)
        .single();

      const barbershopName = profile?.barbershop_name || "nossa barbearia";

      // Get appointments for today and tomorrow that haven't been notified
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          appointment_date,
          appointment_time,
          customer_name,
          customer_phone,
          notification_sent,
          barber:barbers(name)
        `)
        .in("appointment_date", [today, tomorrow])
        .eq("status", "scheduled")
        .order("appointment_date")
        .order("appointment_time");

      if (error) throw error;

      // Transform to PendingReminder format
      const reminders: PendingReminder[] = (data || []).map((apt) => ({
        id: apt.id,
        appointment_id: apt.id,
        client_name: apt.customer_name,
        client_phone: apt.customer_phone,
        client_email: null, // Could be added if profiles have email
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        barber_name: apt.barber?.name || null,
        barbershop_name: barbershopName,
        reminder_sent: apt.notification_sent || false,
      }));

      return reminders;
    },
  });

  // Mark reminder as sent
  const markReminderSent = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({ notification_sent: true })
        .eq("id", appointmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-reminders"] });
    },
  });

  // Sync Growth Engine data
  const syncGrowthEngine = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("growth-engine-sync");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empty-slots"] });
      queryClient.invalidateQueries({ queryKey: ["reactivation-queue"] });
      queryClient.invalidateQueries({ queryKey: ["money-lost-alert"] });
      queryClient.invalidateQueries({ queryKey: ["barber-scores"] });
      queryClient.invalidateQueries({ queryKey: ["pending-reminders"] });
      toast.success("Dados sincronizados com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao sincronizar: " + error.message);
    },
  });

  return {
    // Data
    emptySlots,
    clientBehavior,
    problematicClients,
    reactivationQueue,
    barberScores,
    moneyLostAlert,
    activeClients,
    pendingReminders,
    // Actions
    markAsSent,
    dismissAlert,
    syncGrowthEngine,
    markReminderSent,
  };
};

// Helper to generate WhatsApp link
export const generateWhatsAppLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${fullPhone}?text=${encodedMessage}`;
};
