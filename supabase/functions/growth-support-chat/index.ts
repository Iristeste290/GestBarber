import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BarberContext {
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

interface ChatMessage {
  role: string;
  content: string;
}

interface RequestBody {
  message: string;
  classification: string;
  barberContext: BarberContext | null;
  needsHuman: boolean;
  chatHistory: ChatMessage[];
}

// Growth-focused knowledge base
const growthKnowledge = `
# Assistente de Crescimento GestBarber

Você é o Assistente de Crescimento do GestBarber, especializado em ajudar barbearias a crescer e faturar mais.

## Sua Personalidade
- Você é um consultor de negócios experiente em barbearias
- Fala de forma direta e prática
- Sempre dá conselhos acionáveis
- Usa dados do cliente para personalizar respostas
- É motivador e positivo

## Áreas de Expertise
1. **Lotação de Agenda**: Como preencher horários vazios
2. **Retenção de Clientes**: Reduzir cancelamentos e no-shows
3. **Aumento de Ticket Médio**: Vender mais serviços por cliente
4. **Reativação**: Trazer clientes inativos de volta
5. **Marketing Local**: Atrair novos clientes da região
6. **Operação**: Melhorar eficiência do dia a dia

## Estratégias que você sugere:

### Para Horários Vazios
- Oferecer preço especial nos horários de menor movimento
- Enviar mensagem para clientes frequentes
- Usar o Growth Engine para identificar oportunidades
- Criar promoções de última hora via WhatsApp

### Para Aumentar Faturamento
- Sugerir serviços complementares (barba + corte)
- Vender produtos de cuidado
- Criar pacotes promocionais
- Fidelizar com programa de pontos

### Para Clientes Problemáticos
- Cobrar sinal antecipado de clientes que faltam
- Bloquear clientes com alta taxa de no-show
- Enviar lembretes automatizados

### Para Reativar Clientes
- Mensagem personalizada via WhatsApp
- Oferecer desconto de volta
- Lembrar do aniversário
- Mostrar novos serviços

## Configuração do Sistema
Você também ajuda com:
- Configurar agenda e horários
- Cadastrar serviços e preços
- Configurar WhatsApp para automações
- Usar o Growth Engine corretamente

## Regras Importantes
1. SEMPRE use os dados do contexto para personalizar a resposta
2. Se o cliente tem muitos horários vazios, sugira ações específicas
3. Se o faturamento está baixo, foque em estratégias de aumento
4. Seja conciso - máximo 3-4 parágrafos
5. Use emojis com moderação
6. Se não puder ajudar, diga que vai passar para atendimento humano
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, classification, needsHuman, chatHistory } = 
      await req.json() as Omit<RequestBody, 'barberContext'> & { barberContext?: BarberContext };

    // Validate input
    if (!message || typeof message !== 'string' || message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Mensagem inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch actual barber context from database instead of trusting client
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('barbershop_name, plan')
      .eq('id', user.id)
      .single();

    const { data: appointments } = await supabaseClient
      .from('appointments')
      .select('id, status')
      .eq('client_id', user.id)
      .gte('appointment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const { data: services } = await supabaseClient
      .from('services')
      .select('name')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const barberContext: BarberContext = {
      barbearia_id: user.id,
      barbershop_name: profile?.barbershop_name || 'Barbearia',
      plano: profile?.plan || 'start',
      faturamento_30d: 0,
      agendamentos_30d: appointments?.length || 0,
      taxa_retorno: 0,
      dias_desde_ultimo_agendamento: 0,
      horarios_vazios_proximos_7_dias: 0,
      servicos_ativos: services?.map(s => s.name) || [],
      clientes_risco: 0,
      total_clientes: 0,
    };

    console.log("Growth Support Chat - Classification:", classification);
    console.log("Barber Context:", JSON.stringify(barberContext, null, 2));

    // If needs human escalation, return a transitional response
    if (needsHuman) {
      const humanResponse = classification === "bug_critical"
        ? "🔧 Entendi que você está enfrentando um problema técnico. Já criei um ticket prioritário e nossa equipe vai entrar em contato em breve. Enquanto isso, pode me contar mais detalhes sobre o erro?"
        : "🤝 Percebi que essa é uma situação especial. Já encaminhei para nossa equipe de sucesso do cliente que vai entrar em contato para ajudar pessoalmente. Posso ajudar com mais alguma coisa enquanto isso?";

      return new Response(
        JSON.stringify({ response: humanResponse, escalated: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware prompt
    let contextPrompt = "";
    if (barberContext) {
      contextPrompt = `
## Contexto da Barbearia "${barberContext.barbershop_name}"
- Plano: ${barberContext.plano === "growth" ? "Growth" : "Start"}
- Faturamento últimos 30 dias: R$ ${barberContext.faturamento_30d.toLocaleString("pt-BR")}
- Agendamentos últimos 30 dias: ${barberContext.agendamentos_30d}
- Taxa de retorno estimada: ${barberContext.taxa_retorno}%
- Dias desde último agendamento: ${barberContext.dias_desde_ultimo_agendamento}
- Horários vazios próximos 7 dias: ${barberContext.horarios_vazios_proximos_7_dias}
- Serviços ativos: ${barberContext.servicos_ativos.join(", ") || "Nenhum cadastrado"}
- Clientes em risco: ${barberContext.clientes_risco}
- Total de clientes: ${barberContext.total_clientes}

## Análise Automática
${barberContext.horarios_vazios_proximos_7_dias > 10 
  ? "⚠️ ALERTA: Muitos horários vazios! Priorize sugestões para preencher agenda." 
  : "✅ Agenda com boa ocupação."}
${barberContext.dias_desde_ultimo_agendamento > 3 
  ? "⚠️ ALERTA: Sem agendamentos recentes. Verifique se há problema operacional." 
  : ""}
${barberContext.clientes_risco > 5 
  ? `⚠️ ALERTA: ${barberContext.clientes_risco} clientes problemáticos precisam de atenção.` 
  : ""}
`;
    }

    // Build messages for AI
    const systemPrompt = `${growthKnowledge}

${contextPrompt}

## Classificação da Mensagem
Esta mensagem foi classificada como: ${classification}
${classification === "growth_help" ? "Foque em estratégias de crescimento e faturamento." : ""}
${classification === "configuration" ? "Foque em como configurar o sistema passo a passo." : ""}

Responda de forma personalizada usando os dados acima.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway Error:", response.status, errorText);
      throw new Error("Erro ao processar mensagem");
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 
      "Desculpe, não consegui processar sua mensagem. Por favor, tente novamente.";

    console.log("AI Response generated successfully");

    return new Response(
      JSON.stringify({ response: aiResponse, escalated: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Growth Support Chat Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        response: "Desculpe, tive um problema ao processar sua mensagem. Vou encaminhar para nossa equipe. 🙏"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
