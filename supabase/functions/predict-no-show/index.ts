import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get appointment details
    const { data: appointment, error: aptError } = await supabase
      .from("appointments")
      .select(`
        id,
        customer_name,
        customer_phone,
        appointment_date,
        appointment_time,
        client_id,
        barber_id,
        services(name, price)
      `)
      .eq("id", appointmentId)
      .single();

    if (aptError || !appointment) {
      throw new Error("Agendamento não encontrado");
    }

    // Get client behavior data
    const { data: clientBehavior } = await supabase
      .from("client_behavior")
      .select("*")
      .eq("client_id", appointment.client_id)
      .single();

    // Get historical appointments for this client
    const { data: history } = await supabase
      .from("appointments")
      .select("status, appointment_date, appointment_time")
      .eq("client_id", appointment.client_id)
      .order("appointment_date", { ascending: false })
      .limit(20);

    // Calculate no-show patterns
    const stats = {
      totalAppointments: history?.length || 0,
      noShows: history?.filter(h => h.status === "no_show").length || 0,
      cancellations: history?.filter(h => h.status === "cancelled").length || 0,
      completed: history?.filter(h => h.status === "completed").length || 0,
      cancelRate: clientBehavior?.cancel_rate || 0,
      classification: clientBehavior?.classification || "normal",
      lastAppointment: clientBehavior?.last_appointment_date,
    };

    // Check day of week patterns
    const appointmentDayOfWeek = new Date(appointment.appointment_date).getDay();
    const sameDayHistory = history?.filter(h => {
      const day = new Date(h.appointment_date).getDay();
      return day === appointmentDayOfWeek;
    }) || [];
    const sameDayNoShows = sameDayHistory.filter(h => h.status === "no_show").length;

    // Check time patterns (morning vs afternoon vs evening)
    const hour = parseInt(appointment.appointment_time.split(":")[0]);
    const timeSlot = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const sameTimeHistory = history?.filter(h => {
      const histHour = parseInt(h.appointment_time.split(":")[0]);
      const histSlot = histHour < 12 ? "morning" : histHour < 17 ? "afternoon" : "evening";
      return histSlot === timeSlot;
    }) || [];
    const sameTimeNoShows = sameTimeHistory.filter(h => h.status === "no_show").length;

    // Use AI to analyze and predict
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const prompt = `Você é um especialista em análise de comportamento de clientes para barbearias.

Analise os dados do cliente abaixo e forneça uma previsão de probabilidade de no-show (não comparecimento).

DADOS DO CLIENTE:
- Nome: ${appointment.customer_name}
- Total de agendamentos: ${stats.totalAppointments}
- No-shows anteriores: ${stats.noShows}
- Cancelamentos: ${stats.cancellations}
- Comparecimentos: ${stats.completed}
- Taxa de cancelamento: ${stats.cancelRate.toFixed(1)}%
- Classificação atual: ${stats.classification}
- Último agendamento: ${stats.lastAppointment || "Primeiro agendamento"}

PADRÕES IDENTIFICADOS:
- No mesmo dia da semana (${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][appointmentDayOfWeek]}): ${sameDayHistory.length} agendamentos, ${sameDayNoShows} no-shows
- No mesmo horário (${timeSlot === "morning" ? "manhã" : timeSlot === "afternoon" ? "tarde" : "noite"}): ${sameTimeHistory.length} agendamentos, ${sameTimeNoShows} no-shows

AGENDAMENTO ATUAL:
- Data: ${appointment.appointment_date}
- Horário: ${appointment.appointment_time}
- Serviço: ${(appointment.services as any)?.name || "N/A"}
- Valor: R$ ${(appointment.services as any)?.price?.toFixed(2) || "0.00"}

Forneça EXATAMENTE neste formato JSON:
{
  "probability": <número de 0 a 100>,
  "riskLevel": "<low|medium|high|critical>",
  "factors": ["<fator1>", "<fator2>", "<fator3>"],
  "recommendation": "<recomendação específica>",
  "suggestedActions": ["<ação1>", "<ação2>"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você retorna APENAS JSON válido, sem markdown ou explicações." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Limite de taxa excedido. Tente novamente em alguns segundos.");
      }
      if (response.status === 402) {
        throw new Error("Créditos insuficientes.");
      }
      throw new Error("Erro ao conectar com a IA");
    }

    const aiResult = await response.json();
    let prediction;
    
    try {
      const content = aiResult.choices[0].message.content;
      // Remove markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      prediction = JSON.parse(jsonStr);
    } catch {
      // Fallback calculation if AI fails
      const baseRisk = stats.cancelRate * 0.7;
      const noShowRatio = stats.totalAppointments > 0 
        ? (stats.noShows / stats.totalAppointments) * 100 
        : 0;
      const probability = Math.min(100, Math.round((baseRisk + noShowRatio) / 2));
      
      prediction = {
        probability,
        riskLevel: probability >= 60 ? "critical" : probability >= 40 ? "high" : probability >= 20 ? "medium" : "low",
        factors: stats.noShows > 0 ? ["Histórico de não comparecimento"] : ["Sem histórico suficiente"],
        recommendation: probability >= 40 ? "Enviar lembrete via WhatsApp" : "Agendamento normal",
        suggestedActions: ["Enviar lembrete 24h antes", "Confirmar presença no dia"]
      };
    }

    return new Response(
      JSON.stringify({
        appointmentId,
        customerName: appointment.customer_name,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        prediction,
        stats
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
