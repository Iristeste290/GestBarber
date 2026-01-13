import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "./useRequireAuth";
import { usePlanValidation } from "./usePlanValidation";

export interface BarberContext {
  barbearia_id: string;
  barbershop_name: string;
  plano: string;
  faturamento_30d: number;
  agendamentos_30d: number;
  taxa_retorno: number;
  dias_desde_ultimo_agendamento: number;
  horarios_vazios_proximos_7_dias: number;
  servicos_ativos: string[];
  clientes_risco: number;
  total_clientes: number;
}

export interface SupportMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  classification?: string;
  created_at: string;
}

type MessageClassification = 
  | "basic_question"
  | "configuration"
  | "growth_help"
  | "bug_critical"
  | "high_value_client";

// Keywords for classification
const CLASSIFICATION_KEYWORDS: Record<MessageClassification, string[]> = {
  bug_critical: [
    "bug", "erro", "não funciona", "travou", "crash", "problema grave", 
    "dados perdidos", "não carrega", "quebrou", "corrompido"
  ],
  high_value_client: [
    "cancelar assinatura", "não vou renovar", "vou sair", "outro sistema",
    "concorrente", "não estou satisfeito", "quero reembolso"
  ],
  growth_help: [
    "crescer", "faturamento", "aumentar", "clientes", "marketing",
    "vendas", "estratégia", "lucro", "renda", "ganhar mais"
  ],
  configuration: [
    "configurar", "setup", "ajustar", "cadastrar", "como faço",
    "onde fica", "ativar", "desativar", "mudar"
  ],
  basic_question: [] // default fallback
};

export const useGrowthSupport = () => {
  const { user } = useRequireAuth();
  const { isGrowth } = usePlanValidation();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch barbershop context for AI
  const { data: barberContext, isLoading: contextLoading } = useQuery({
    queryKey: ["barber-context", user?.id],
    queryFn: async (): Promise<BarberContext | null> => {
      if (!user?.id) return null;

      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("barbershop_name")
        .eq("id", user.id)
        .single();

      // Get subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_type")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      // Get 30 days stats - payments/appointments
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

      // Get payments sum
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .gte("created_at", thirtyDaysAgoStr);

      const faturamento30d = payments?.reduce((acc, p) => acc + p.amount, 0) || 0;

      // Get appointments count
      const { data: appointments, count: appointmentsCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact" })
        .gte("appointment_date", thirtyDaysAgoStr);

      // Get last appointment
      const { data: lastAppointment } = await supabase
        .from("appointments")
        .select("appointment_date")
        .order("appointment_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      let diasDesdeUltimoAgendamento = 0;
      if (lastAppointment) {
        const lastDate = new Date(lastAppointment.appointment_date);
        const today = new Date();
        diasDesdeUltimoAgendamento = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Get empty slots next 7 days
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      const today = new Date().toISOString().split("T")[0];
      const sevenDaysLaterStr = sevenDaysLater.toISOString().split("T")[0];

      const { count: emptySlotsCount } = await supabase
        .from("empty_slots")
        .select("*", { count: "exact" })
        .gte("slot_date", today)
        .lte("slot_date", sevenDaysLaterStr)
        .eq("status", "open");

      // Get active services
      const { data: services } = await supabase
        .from("services")
        .select("name")
        .eq("user_id", user.id)
        .eq("is_active", true);

      // Get problem clients
      const { count: clientesRisco } = await supabase
        .from("client_behavior")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .in("classification", ["risco", "bloqueado"]);

      // Get total clients
      const { count: totalClientes } = await supabase
        .from("client_behavior")
        .select("*", { count: "exact" })
        .eq("user_id", user.id);

      // Calculate return rate (approximate)
      const taxaRetorno = totalClientes && totalClientes > 0 
        ? Math.round((appointmentsCount || 0) / totalClientes * 10) 
        : 0;

      return {
        barbearia_id: user.id,
        barbershop_name: profile?.barbershop_name || "Barbearia",
        plano: subscription?.plan_type || "freemium",
        faturamento_30d: faturamento30d,
        agendamentos_30d: appointmentsCount || 0,
        taxa_retorno: taxaRetorno,
        dias_desde_ultimo_agendamento: diasDesdeUltimoAgendamento,
        horarios_vazios_proximos_7_dias: emptySlotsCount || 0,
        servicos_ativos: services?.map(s => s.name) || [],
        clientes_risco: clientesRisco || 0,
        total_clientes: totalClientes || 0,
      };
    },
    enabled: !!user?.id && isGrowth,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch chat history
  const { data: chatHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["support-chat-history", user?.id],
    queryFn: async (): Promise<SupportMessage[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("support_chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      return (data || []) as SupportMessage[];
    },
    enabled: !!user?.id && isGrowth,
  });

  // Classify message locally before sending
  const classifyMessage = useCallback((message: string): MessageClassification => {
    const lowerMessage = message.toLowerCase();

    for (const [classification, keywords] of Object.entries(CLASSIFICATION_KEYWORDS)) {
      if (classification === "basic_question") continue;
      if (keywords.some(kw => lowerMessage.includes(kw))) {
        return classification as MessageClassification;
      }
    }

    return "basic_question";
  }, []);

  // Log interaction for Start users (for upsell triggers)
  const logInteraction = useMutation({
    mutationFn: async (interactionType: string) => {
      if (!user?.id) return;

      const { error } = await supabase
        .from("support_interaction_logs")
        .insert({
          user_id: user.id,
          interaction_type: interactionType,
          metadata: { timestamp: new Date().toISOString() }
        });

      if (error) console.error("Error logging interaction:", error);
    },
  });

  // Check if should show upsell modal
  const { data: shouldShowUpsell } = useQuery({
    queryKey: ["support-upsell-trigger", user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id || isGrowth) return false;

      // Check if user clicked support 2+ times
      const { count } = await supabase
        .from("support_interaction_logs")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .eq("interaction_type", "support_click");

      return (count || 0) >= 2;
    },
    enabled: !!user?.id && !isGrowth,
  });

  // Send message and get AI response
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const classification = classifyMessage(content);

      // Save user message
      const { error: insertError } = await supabase
        .from("support_chat_messages")
        .insert({
          user_id: user.id,
          role: "user",
          content,
          classification,
        });

      if (insertError) throw insertError;

      // Check if needs human escalation
      const needsHuman = classification === "bug_critical" || classification === "high_value_client";

      if (needsHuman) {
        // Create support ticket
        await createEscalationTicket(content, classification);
      }

      // Call AI edge function
      const response = await supabase.functions.invoke("growth-support-chat", {
        body: {
          message: content,
          classification,
          barberContext,
          needsHuman,
          chatHistory: chatHistory?.slice(-10) || [],
        },
      });

      if (response.error) throw new Error(response.error.message);

      // Save assistant response
      const aiResponse = response.data?.response || "Desculpe, não consegui processar sua mensagem.";
      
      await supabase
        .from("support_chat_messages")
        .insert({
          user_id: user.id,
          role: "assistant",
          content: aiResponse,
          classification,
        });

      return { response: aiResponse, classification, needsHuman };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-chat-history", user?.id] });
    },
  });

  // Create escalation ticket for human support
  const createEscalationTicket = async (message: string, classification: string) => {
    if (!user?.id || !barberContext) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    const aiSummary = `Barbearia ${barberContext.barbershop_name} com faturamento R$${barberContext.faturamento_30d.toLocaleString("pt-BR")} - ${classification === "bug_critical" ? "Problema crítico reportado" : "Cliente de alto valor necessita atenção"}. ${barberContext.horarios_vazios_proximos_7_dias} horários vazios nos próximos 7 dias.`;

    await supabase.from("support_tickets").insert({
      user_id: user.id,
      nome: profile?.full_name || "Usuário Growth",
      email: user.email || "",
      whatsapp: profile?.phone || "",
      tipo: classification === "bug_critical" ? "Problema técnico" : "Solicitação especial",
      mensagem: message,
      plano: "Growth",
      classification,
      ai_summary: aiSummary,
      faturamento_30d: barberContext.faturamento_30d,
      agendamentos_30d: barberContext.agendamentos_30d,
      taxa_retorno: barberContext.taxa_retorno,
      priority_score: calculatePriorityScore(barberContext, classification),
    });
  };

  // Calculate priority score for ticket queue
  const calculatePriorityScore = (context: BarberContext, classification: string): number => {
    let score = 0;

    // Higher revenue = higher priority
    if (context.faturamento_30d > 10000) score += 50;
    else if (context.faturamento_30d > 5000) score += 30;
    else if (context.faturamento_30d > 2000) score += 20;

    // Classification priority
    if (classification === "bug_critical") score += 40;
    if (classification === "high_value_client") score += 35;
    if (classification === "growth_help") score += 20;

    // Activity level
    if (context.agendamentos_30d > 100) score += 15;
    else if (context.agendamentos_30d > 50) score += 10;

    // Risk indicators
    if (context.horarios_vazios_proximos_7_dias > 20) score += 10;
    if (context.dias_desde_ultimo_agendamento > 7) score += 5;

    return score;
  };

  // Clear chat history
  const clearHistory = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { error } = await supabase
        .from("support_chat_messages")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-chat-history", user?.id] });
    },
  });

  return {
    barberContext,
    chatHistory: chatHistory || [],
    isLoading: isLoading || contextLoading || historyLoading,
    sendMessage,
    clearHistory,
    logInteraction,
    shouldShowUpsell: shouldShowUpsell || false,
    classifyMessage,
  };
};
