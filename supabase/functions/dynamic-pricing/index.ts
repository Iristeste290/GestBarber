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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Não autorizado");
    }

    // Get barber IDs for this user
    const { data: barbers } = await supabase
      .from("barbers")
      .select("id, name")
      .eq("user_id", user.id);

    if (!barbers || barbers.length === 0) {
      throw new Error("Nenhum barbeiro encontrado");
    }

    const barberIds = barbers.map(b => b.id);

    // Get services
    const { data: services } = await supabase
      .from("services")
      .select("id, name, price, duration_minutes")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (!services || services.length === 0) {
      throw new Error("Nenhum serviço encontrado");
    }

    // Get last 90 days of appointments for analysis
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: appointments } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        service_id,
        services(name, price)
      `)
      .in("barber_id", barberIds)
      .gte("appointment_date", ninetyDaysAgo.toISOString().split("T")[0])
      .order("appointment_date", { ascending: false });

    // Analyze demand patterns
    const demandByDayHour: Record<string, number> = {};
    const demandByService: Record<string, { count: number; revenue: number }> = {};
    
    appointments?.forEach(apt => {
      const day = new Date(apt.appointment_date).getDay();
      const hour = parseInt(apt.appointment_time.split(":")[0]);
      const key = `${day}-${hour}`;
      
      demandByDayHour[key] = (demandByDayHour[key] || 0) + 1;
      
      const serviceId = apt.service_id;
      if (serviceId) {
        if (!demandByService[serviceId]) {
          demandByService[serviceId] = { count: 0, revenue: 0 };
        }
        demandByService[serviceId].count++;
        demandByService[serviceId].revenue += Number((apt.services as any)?.price || 0);
      }
    });

    // Find peak and low demand periods
    const sortedDemand = Object.entries(demandByDayHour)
      .map(([key, count]) => {
        const [day, hour] = key.split("-").map(Number);
        return { day, hour, count };
      })
      .sort((a, b) => b.count - a.count);

    const peakPeriods = sortedDemand.slice(0, 5);
    const lowPeriods = sortedDemand.slice(-5).reverse();

    // Calculate average occupancy
    const totalSlots = 90 * 10 * barbers.length; // 90 days * 10 hours * barbers
    const occupancyRate = ((appointments?.length || 0) / totalSlots) * 100;

    // Use AI to generate pricing suggestions
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    const servicesInfo = services.map(s => ({
      name: s.name,
      currentPrice: s.price,
      demand: demandByService[s.id]?.count || 0,
      revenue: demandByService[s.id]?.revenue || 0,
    }));

    const prompt = `Você é um consultor especialista em precificação dinâmica para barbearias.

DADOS DO NEGÓCIO (últimos 90 dias):
- Total de agendamentos: ${appointments?.length || 0}
- Taxa de ocupação: ${occupancyRate.toFixed(1)}%
- Número de barbeiros: ${barbers.length}

SERVIÇOS ATUAIS:
${servicesInfo.map(s => `- ${s.name}: R$ ${s.currentPrice} (${s.demand} agendamentos, R$ ${s.revenue.toFixed(2)} faturado)`).join("\n")}

HORÁRIOS DE PICO (maior demanda):
${peakPeriods.map(p => `- ${dayNames[p.day]} às ${p.hour}:00 (${p.count} agendamentos)`).join("\n")}

HORÁRIOS VAZIOS (menor demanda):
${lowPeriods.map(p => `- ${dayNames[p.day]} às ${p.hour}:00 (${p.count} agendamentos)`).join("\n")}

Analise esses dados e forneça sugestões de precificação dinâmica para maximizar o faturamento.

Retorne EXATAMENTE neste formato JSON:
{
  "overallAnalysis": "<análise geral do negócio em 2 linhas>",
  "occupancyStatus": "<low|medium|high>",
  "suggestions": [
    {
      "type": "<peak_pricing|off_peak_discount|service_bundle|seasonal>",
      "title": "<título curto>",
      "description": "<descrição da sugestão>",
      "expectedImpact": "<impacto esperado em % de aumento>",
      "implementation": "<como implementar>",
      "priority": "<high|medium|low>"
    }
  ],
  "servicePricing": [
    {
      "serviceName": "<nome do serviço>",
      "currentPrice": <preço atual>,
      "suggestedPrice": <preço sugerido>,
      "reason": "<razão da sugestão>",
      "peakPriceModifier": <modificador % para pico, ex: 15>,
      "offPeakDiscount": <desconto % para baixa, ex: -10>
    }
  ],
  "quickWins": ["<ação rápida 1>", "<ação rápida 2>", "<ação rápida 3>"]
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
    let pricingSuggestions;
    
    try {
      const content = aiResult.choices[0].message.content;
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      pricingSuggestions = JSON.parse(jsonStr);
    } catch {
      // Fallback suggestions
      pricingSuggestions = {
        overallAnalysis: `Taxa de ocupação de ${occupancyRate.toFixed(1)}%. ${occupancyRate < 50 ? "Há espaço para crescimento com promoções em horários vazios." : "Boa ocupação, considere aumentar preços em horários de pico."}`,
        occupancyStatus: occupancyRate < 40 ? "low" : occupancyRate < 70 ? "medium" : "high",
        suggestions: [
          {
            type: "off_peak_discount",
            title: "Desconto em horários vazios",
            description: "Ofereça 10-15% de desconto em horários com baixa demanda",
            expectedImpact: "15-20% mais agendamentos",
            implementation: "Divulgue no WhatsApp e redes sociais",
            priority: "high"
          }
        ],
        servicePricing: services.map(s => ({
          serviceName: s.name,
          currentPrice: s.price,
          suggestedPrice: s.price,
          reason: "Manter preço atual",
          peakPriceModifier: 0,
          offPeakDiscount: 0
        })),
        quickWins: [
          "Criar combos de serviços",
          "Implementar programa de fidelidade",
          "Divulgar horários vazios com desconto"
        ]
      };
    }

    return new Response(
      JSON.stringify({
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        totalAppointments: appointments?.length || 0,
        peakPeriods: peakPeriods.map(p => ({
          day: dayNames[p.day],
          hour: p.hour,
          count: p.count
        })),
        lowPeriods: lowPeriods.map(p => ({
          day: dayNames[p.day],
          hour: p.hour,
          count: p.count
        })),
        services: servicesInfo,
        pricingSuggestions
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
