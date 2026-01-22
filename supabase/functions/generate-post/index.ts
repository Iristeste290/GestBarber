import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const MAX_PAYLOAD_SIZE = 10_000; // 10KB max for text payload

const PostInputSchema = z.object({
  postType: z.enum(["weekly", "promotion", "campaign"], {
    errorMap: () => ({ message: "Tipo de post inválido. Use: weekly, promotion ou campaign" })
  }),
  context: z.string()
    .max(1000, "Contexto muito longo (máx 1000 caracteres)")
    .optional()
    .transform(val => val?.trim()),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check payload size
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return new Response(
        JSON.stringify({ success: false, error: "Payload muito grande" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "JSON inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validationResult = PostInputSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(", ");
      return new Response(
        JSON.stringify({ success: false, error: errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { postType, context } = validationResult.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não está configurado");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (postType === "weekly") {
      systemPrompt = "Você é um especialista em marketing para barbearias. Crie posts atrativos e profissionais para redes sociais.";
      userPrompt = `Crie um post de agenda semanal para uma barbearia. O post deve:
- Ter um título chamativo
- Incluir os dias da semana com disponibilidade
- Usar emojis relevantes
- Ter um call-to-action para agendar
- Ser otimizado para Instagram/Facebook
- Ter no máximo 200 palavras

Contexto: ${context || "Horários disponíveis de segunda a sábado"}`;
    } else if (postType === "promotion") {
      systemPrompt = "Você é um especialista em marketing para barbearias. Crie posts promocionais irresistíveis.";
      userPrompt = `Crie um post de promoção para uma barbearia. O post deve:
- Ter um título impactante
- Destacar o desconto ou oferta
- Criar senso de urgência
- Incluir emojis relevantes
- Ter um call-to-action forte
- Ser otimizado para redes sociais
- Ter no máximo 150 palavras

Contexto: ${context || "Promoção especial para novos clientes"}`;
    } else if (postType === "campaign") {
      systemPrompt = "Você é um especialista em marketing para barbearias. Crie campanhas memoráveis.";
      userPrompt = `Crie um post de campanha para uma barbearia. O post deve:
- Ter um conceito criativo
- Contar uma história
- Conectar emocionalmente com o público
- Incluir emojis relevantes
- Ter um call-to-action
- Ser otimizado para redes sociais
- Ter no máximo 250 palavras

Contexto: ${context || "Campanha de valorização do cliente"}`;
    }

    console.log("Gerando post com Lovable AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error("Limite de requisições excedido. Tente novamente em alguns instantes.");
      }
      if (aiResponse.status === 402) {
        throw new Error("Créditos esgotados. Adicione créditos ao seu workspace Lovable.");
      }
      const errorText = await aiResponse.text();
      console.error("Erro na API de IA:", aiResponse.status, errorText);
      throw new Error("Erro ao gerar post com IA");
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("Conteúdo não gerado pela IA");
    }

    console.log("Post gerado com sucesso");

    const lines = generatedContent.trim().split("\n");
    const title = lines[0].replace(/^#+\s*/, "").substring(0, 100);
    const content = generatedContent;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Configuração do Supabase ausente");
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { data: post, error: insertError } = await supabase
      .from("generated_posts")
      .insert({
        user_id: user.id,
        title,
        content,
        post_type: postType,
        metadata: { context },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao salvar post:", insertError);
      throw new Error("Erro ao salvar post no banco de dados");
    }

    console.log("Post salvo no banco de dados:", post.id);

    return new Response(
      JSON.stringify({
        success: true,
        post: {
          id: post.id,
          title: post.title,
          content: post.content,
          post_type: post.post_type,
          created_at: post.created_at,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função generate-post:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});