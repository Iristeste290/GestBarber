import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportTicketRequest {
  nome: string;
  email: string;
  whatsapp: string;
  tipo: string;
  mensagem: string;
  plano: string;
  device_id?: string;
  app_version?: string;
}

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "GestBarber Suporte <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting support ticket creation...");

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("User authenticated:", user.id);

    // Parse request body
    const body: SupportTicketRequest = await req.json();
    console.log("Request body received:", { ...body, mensagem: body.mensagem?.substring(0, 50) + "..." });

    // Validate required fields
    if (!body.nome || !body.email || !body.whatsapp || !body.tipo || !body.mensagem) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios não preenchidos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      console.error("Invalid email format");
      return new Response(
        JSON.stringify({ error: "E-mail inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert ticket into database using service role for insert
    const supabaseServiceRole = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const ticketData = {
      user_id: user.id,
      nome: body.nome,
      email: body.email,
      whatsapp: body.whatsapp,
      tipo: body.tipo,
      mensagem: body.mensagem,
      plano: body.plano || "Free",
      device_id: body.device_id || null,
      app_version: body.app_version || null,
      status: "novo"
    };

    console.log("Inserting ticket into database...");
    const { data: ticket, error: insertError } = await supabaseServiceRole
      .from("support_tickets")
      .insert(ticketData)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting ticket:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar ticket de suporte" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Ticket created successfully:", ticket.id);

    // Format date for email
    const createdAt = new Date(ticket.created_at).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "full",
      timeStyle: "short"
    });

    // Send email notification
    console.log("Sending email notification...");
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
            📩 Novo chamado recebido no GestBarber
          </h2>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>👤 Usuário:</strong> ${body.nome}</p>
            <p><strong>📋 Plano:</strong> ${body.plano || "Free"}</p>
            <p><strong>🏷️ Tipo:</strong> ${body.tipo}</p>
          </div>
          
          <div style="background: #fff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">💬 Mensagem:</h3>
            <p style="color: #4b5563; line-height: 1.6;">${body.mensagem.replace(/\n/g, "<br>")}</p>
          </div>
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #065f46; margin-top: 0;">📞 Contato do usuário:</h4>
            <p><strong>WhatsApp:</strong> ${body.whatsapp}</p>
            <p><strong>E-mail:</strong> ${body.email}</p>
          </div>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 12px; color: #6b7280;">
            <p><strong>🔧 Informações técnicas:</strong></p>
            <p>Device ID: ${body.device_id || "Não informado"}</p>
            <p>Versão do App: ${body.app_version || "Não informada"}</p>
            <p>Data: ${createdAt}</p>
            <p>Ticket ID: ${ticket.id}</p>
          </div>
        </div>
      `;

      // TODO: Alterar para suportegestbarber@gmail.com após verificar domínio no Resend
      await sendEmail(
        "gustavojordand7@gmail.com",
        "📩 Novo chamado de suporte – GestBarber",
        emailHtml
      );

      console.log("Email sent successfully");
    } catch (emailError) {
      // Log error but don't fail the request - ticket was already created
      console.error("Error sending email (ticket still created):", emailError);
    }

    // Return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Ticket criado com sucesso",
        ticketId: ticket.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
