import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { historicalData } = await req.json();
    
    if (!historicalData || historicalData.length === 0) {
      throw new Error("Dados históricos não fornecidos");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Preparar dados para a IA
    const dataString = historicalData
      .map((item: any) => `${item.month}: R$ ${item.revenue.toFixed(2)}`)
      .join("\n");

    const systemPrompt = `Você é um especialista em análise financeira e previsão de faturamento para barbearias. 
Analise os dados históricos fornecidos e faça uma previsão realista do faturamento para o próximo mês.
Considere: tendências, sazonalidade e variações.
Seja específico com valores e forneça uma breve justificativa.`;

    const userPrompt = `Com base nos dados de faturamento dos últimos meses abaixo, faça uma previsão para o próximo mês:

${dataString}

Forneça:
1. Previsão de faturamento (valor exato em R$)
2. Tendência identificada (crescimento, queda ou estável)
3. Breve justificativa (máximo 3 linhas)
4. Recomendação de ação (se aplicável)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Limite de taxa excedido. Tente novamente em alguns segundos.");
      }
      if (response.status === 402) {
        throw new Error("Créditos insuficientes. Adicione mais créditos ao workspace.");
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("Erro ao conectar com a IA");
    }

    const aiResult = await response.json();
    const forecast = aiResult.choices[0].message.content;

    return new Response(
      JSON.stringify({ forecast }),
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
