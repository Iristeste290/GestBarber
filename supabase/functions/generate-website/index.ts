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
    const { barbershopName, style, services, whatsapp, address } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const servicesText = services
      .map((s: any) => `- ${s.name}: R$ ${s.price}${s.description ? ` - ${s.description}` : ''}`)
      .join('\n');

    const styleDescriptions = {
      classica: 'tradicional, elegante, com tons escuros e dourados, estilo vintage barbershop',
      moderna: 'contemporânea, limpa, minimalista, com cores vibrantes e design moderno',
      premium: 'luxuosa, sofisticada, exclusiva, com acabamentos refinados e experiência VIP',
    };

    const systemPrompt = `Você é um especialista em criar textos para sites de barbearias brasileiras. 
Gere conteúdo persuasivo, profissional e otimizado para SEO local.
Use português brasileiro natural e coloquial.
Responda APENAS em JSON válido, sem markdown.`;

    const userPrompt = `Crie o conteúdo para o site da barbearia "${barbershopName}".

Estilo: ${styleDescriptions[style as keyof typeof styleDescriptions] || styleDescriptions.moderna}
${address ? `Endereço: ${address}` : ''}
WhatsApp: ${whatsapp}

Serviços:
${servicesText || 'Corte de cabelo, barba, e outros serviços de barbearia'}

Gere um JSON com esta estrutura exata:
{
  "heroTitle": "Título principal impactante (máx 60 chars)",
  "heroSubtitle": "Subtítulo persuasivo (máx 120 chars)",
  "aboutTitle": "Título da seção sobre (máx 40 chars)",
  "aboutText": "Texto sobre a barbearia (2-3 parágrafos)",
  "servicesTitle": "Título da seção de serviços",
  "ctaTitle": "Chamada para ação",
  "ctaText": "Texto do botão de WhatsApp",
  "metaTitle": "Título SEO (máx 60 chars)",
  "metaDescription": "Descrição SEO (máx 160 chars)"
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("Erro ao gerar conteúdo com IA");
    }

    const aiResponse = await response.json();
    const contentText = aiResponse.choices?.[0]?.message?.content || "";
    
    // Parse the JSON content
    let content;
    try {
      // Try to extract JSON from the response
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("JSON não encontrado na resposta");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", contentText);
      // Fallback content
      content = {
        heroTitle: `Bem-vindo à ${barbershopName}`,
        heroSubtitle: "Sua barbearia de confiança. Estilo e qualidade em cada corte.",
        aboutTitle: "Sobre Nós",
        aboutText: `A ${barbershopName} é referência em barbearia na região. Oferecemos serviços de alta qualidade com profissionais experientes e ambiente acolhedor.`,
        servicesTitle: "Nossos Serviços",
        ctaTitle: "Agende seu horário",
        ctaText: "Agendar pelo WhatsApp",
        metaTitle: `${barbershopName} - Barbearia`,
        metaDescription: `${barbershopName} - Cortes de cabelo, barba e muito mais. Agende seu horário!`,
      };
    }

    return new Response(
      JSON.stringify({
        description: content.metaDescription || `Site da ${barbershopName}`,
        content: {
          ...content,
          barbershopName,
          style,
          services,
          whatsapp,
          address,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-website:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
