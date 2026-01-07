import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactEmailRequest = await req.json();

    // Validate inputs
    if (!name || !email || !subject || !message) {
      console.error("Missing required fields:", { name, email, subject, message });
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Formato de e-mail inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending contact email from:", name, email);

    // Send email to support
    const supportEmailResponse = await resend.emails.send({
      from: "BarberPro <onboarding@resend.dev>",
      to: ["suporte@barberpro.com.br"], // Change to your support email
      reply_to: email,
      subject: `[Contato] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px;">
            Nova mensagem de contato
          </h2>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>E-mail:</strong> ${email}</p>
            <p><strong>Assunto:</strong> ${subject}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Mensagem:</h3>
            <p style="white-space: pre-wrap; color: #4b5563;">${message}</p>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
            Esta mensagem foi enviada através do formulário de contato do BarberPro.
          </p>
        </div>
      `,
    });

    console.log("Support email sent:", supportEmailResponse);

    // Send confirmation email to user
    const confirmationResponse = await resend.emails.send({
      from: "BarberPro <onboarding@resend.dev>",
      to: [email],
      subject: "Recebemos sua mensagem - BarberPro",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Olá ${name}! 👋</h2>
          
          <p>Recebemos sua mensagem e nossa equipe entrará em contato em breve.</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Resumo da sua mensagem:</h3>
            <p><strong>Assunto:</strong> ${subject}</p>
            <p style="white-space: pre-wrap; color: #4b5563;">${message}</p>
          </div>
          
          <p>Enquanto isso, você pode explorar nossa <a href="https://barberpro.com.br/ajuda" style="color: #8B5CF6;">Central de Ajuda</a> para encontrar respostas para as dúvidas mais comuns.</p>
          
          <p style="margin-top: 30px;">
            Atenciosamente,<br>
            <strong>Equipe BarberPro</strong>
          </p>
        </div>
      `,
    });

    console.log("Confirmation email sent:", confirmationResponse);

    return new Response(
      JSON.stringify({ success: true, message: "E-mail enviado com sucesso!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao enviar e-mail" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
