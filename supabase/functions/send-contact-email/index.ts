import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

async function sendEmailViaSMTP(
  to: string | string[],
  subject: string,
  html: string,
  replyTo?: string
): Promise<{ success: boolean; error?: string }> {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = Deno.env.get("SMTP_PORT");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    console.error("SMTP configuration is incomplete");
    return { success: false, error: "Configuração SMTP incompleta" };
  }

  const client = new SMTPClient({
    connection: {
      hostname: smtpHost,
      port: parseInt(smtpPort, 10),
      tls: true,
      auth: {
        username: smtpUser,
        password: smtpPassword,
      },
    },
  });

  try {
    const recipients = Array.isArray(to) ? to : [to];
    
    await client.send({
      from: `GestBarber <${smtpUser}>`,
      to: recipients,
      replyTo: replyTo,
      subject: subject,
      content: "auto",
      html: html,
    });

    await client.close();
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    await client.close();
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    };
  }
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

    const smtpUser = Deno.env.get("SMTP_USER") || "suporte@gestbarber.com.br";

    // Send email to support
    const supportEmailResult = await sendEmailViaSMTP(
      smtpUser,
      `[Contato] ${subject}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">
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
            Esta mensagem foi enviada através do formulário de contato do GestBarber.
          </p>
        </div>
      `,
      email
    );

    if (!supportEmailResult.success) {
      console.error("Failed to send support email:", supportEmailResult.error);
      return new Response(
        JSON.stringify({ error: supportEmailResult.error || "Erro ao enviar e-mail" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Support email sent successfully");

    // Send confirmation email to user
    const confirmationResult = await sendEmailViaSMTP(
      email,
      "Recebemos sua mensagem - GestBarber",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Olá ${name}! 👋</h2>
          
          <p>Recebemos sua mensagem e nossa equipe entrará em contato em breve.</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Resumo da sua mensagem:</h3>
            <p><strong>Assunto:</strong> ${subject}</p>
            <p style="white-space: pre-wrap; color: #4b5563;">${message}</p>
          </div>
          
          <p>Enquanto isso, você pode explorar nossa <a href="https://gestbarber.com.br/ajuda" style="color: #22c55e;">Central de Ajuda</a> para encontrar respostas para as dúvidas mais comuns.</p>
          
          <p style="margin-top: 30px;">
            Atenciosamente,<br>
            <strong>Equipe GestBarber</strong>
          </p>
        </div>
      `
    );

    if (!confirmationResult.success) {
      console.log("Confirmation email failed but support email was sent:", confirmationResult.error);
      // Don't fail the request if confirmation email fails
    } else {
      console.log("Confirmation email sent to:", email);
    }

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
