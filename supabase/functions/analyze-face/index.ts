import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const MAX_IMAGE_SIZE = 5_000_000; // 5MB max for base64 image

const ImageInputSchema = z.object({
  imageBase64: z.string()
    .min(100, "Imagem muito pequena")
    .max(MAX_IMAGE_SIZE, "Imagem muito grande (máx 5MB)")
    .refine(
      (val) => val.startsWith("data:image/") || val.startsWith("/9j/") || val.startsWith("iVBOR"),
      "Formato de imagem inválido. Use JPEG, PNG ou WebP."
    ),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check payload size before parsing
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE + 1000) {
      return new Response(
        JSON.stringify({ error: "Payload muito grande. Máximo: 5MB" }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "JSON inválido" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validationResult = ImageInputSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(", ");
      return new Response(
        JSON.stringify({ error: errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageBase64 } = validationResult.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    console.log("Analisando formato facial...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em análise facial e estilismo capilar para barbearia. 
Sua tarefa é analisar o formato do rosto na foto e sugerir cortes de cabelo masculinos que melhor combinam.

Analise cuidadosamente:
1. Formato do rosto (oval, redondo, quadrado, triangular, coração, longo/retangular)
2. Características faciais (linha do maxilar, testa, queixo)
3. Tipo de cabelo visível (liso, ondulado, cacheado, crespo)

Forneça 4-5 sugestões de cortes específicos com:
- Nome do corte
- Descrição breve (2-3 linhas)
- Por que combina com esse formato facial
- Dificuldade de manutenção (baixa, média, alta)

Seja específico, prático e profissional. Use linguagem clara em português brasileiro.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta foto e sugira cortes de cabelo que combinem com o formato facial da pessoa."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace Lovable." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("Erro na API de IA:", response.status, errorText);
      throw new Error("Erro ao analisar imagem com IA");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error("Resposta da IA vazia");
    }

    console.log("Análise concluída com sucesso");

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Erro no analyze-face:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});