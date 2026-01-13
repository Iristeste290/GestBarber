import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GrowthStats {
  userId: string;
  email: string;
  barbershopName: string;
  pendingReminders: number;
  emptySlots: number;
  inactiveClients: number;
}

async function sendEmailViaSMTP(to: string, subject: string, html: string): Promise<boolean> {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = Deno.env.get("SMTP_PORT");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    console.error("SMTP configuration is incomplete");
    return false;
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
    await client.send({
      from: `GestBarber <${smtpUser}>`,
      to: [to],
      subject: subject,
      content: "auto",
      html: html,
    });

    await client.close();
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    await client.close();
    return false;
  }
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting daily growth email job...");

    // Get today's date
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Get all active users/barbershops
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, barbershop_name");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    const stats: GrowthStats[] = [];

    for (const profile of profiles || []) {
      // Get user email from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
      if (!authUser?.user?.email) continue;

      // Count pending reminders (appointments today/tomorrow without notification)
      const { count: pendingReminders } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .in("appointment_date", [today, tomorrow])
        .eq("status", "scheduled")
        .eq("notification_sent", false)
        .eq("client_id", profile.id);

      // Count empty slots for today
      const { count: emptySlots } = await supabase
        .from("empty_slots")
        .select("id", { count: "exact", head: true })
        .eq("slot_date", today)
        .eq("status", "open")
        .eq("user_id", profile.id);

      // Count inactive clients (reactivation queue)
      const { count: inactiveClients } = await supabase
        .from("reactivation_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("user_id", profile.id);

      // Only send email if there are issues
      const totalIssues = (pendingReminders || 0) + (emptySlots || 0) + (inactiveClients || 0);
      
      if (totalIssues > 0) {
        stats.push({
          userId: profile.id,
          email: authUser.user.email,
          barbershopName: profile.barbershop_name || "Sua Barbearia",
          pendingReminders: pendingReminders || 0,
          emptySlots: emptySlots || 0,
          inactiveClients: inactiveClients || 0,
        });
      }
    }

    console.log(`Found ${stats.length} barbershops with pending actions`);

    // Send emails via SMTP
    let emailsSent = 0;
    for (const stat of stats) {
      const emailHtml = generateEmailHtml(stat);
      const subject = `📊 Relatório Diário - ${stat.barbershopName}`;
      
      const success = await sendEmailViaSMTP(stat.email, subject, emailHtml);
      if (success) {
        emailsSent++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        totalBarbershops: stats.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in daily-growth-email:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

function generateEmailHtml(stats: GrowthStats): string {
  const items = [];
  
  if (stats.pendingReminders > 0) {
    items.push(`
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <span style="font-size: 24px;">⏰</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${stats.pendingReminders}</strong> cliente${stats.pendingReminders !== 1 ? 's' : ''} sem lembrete
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; color: #f59e0b;">
          ⚠️ Urgente
        </td>
      </tr>
    `);
  }
  
  if (stats.emptySlots > 0) {
    items.push(`
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <span style="font-size: 24px;">📅</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${stats.emptySlots}</strong> horário${stats.emptySlots !== 1 ? 's' : ''} vazio${stats.emptySlots !== 1 ? 's' : ''} hoje
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; color: #ef4444;">
          💸 Perdendo dinheiro
        </td>
      </tr>
    `);
  }
  
  if (stats.inactiveClients > 0) {
    items.push(`
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <span style="font-size: 24px;">👥</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${stats.inactiveClients}</strong> cliente${stats.inactiveClients !== 1 ? 's' : ''} para reativar
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; color: #3b82f6;">
          📲 Envie mensagem
        </td>
      </tr>
    `);
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório Diário - GestBarber</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a1a1a; margin-bottom: 5px;">📊 Relatório Diário</h1>
        <p style="color: #666; margin: 0;">${stats.barbershopName}</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0 0 10px 0;">🚨 Atenção Necessária</h2>
        <p style="margin: 0; opacity: 0.9;">Você tem oportunidades de receita esperando ação.</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background: #f8f8f8;">
            <th style="padding: 12px; text-align: left; width: 50px;"></th>
            <th style="padding: 12px; text-align: left;">Item</th>
            <th style="padding: 12px; text-align: left;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${items.join('')}
        </tbody>
      </table>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://gestbarber.com.br/growth-engine" 
           style="display: inline-block; background: #22c55e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Abrir Growth Engine →
        </a>
      </div>
      
      <p style="text-align: center; color: #999; font-size: 12px; margin-top: 40px;">
        Você está recebendo este email porque possui uma conta ativa no GestBarber.<br>
        © ${new Date().getFullYear()} GestBarber - Todos os direitos reservados
      </p>
    </body>
    </html>
  `;
}
