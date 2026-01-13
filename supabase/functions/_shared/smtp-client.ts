import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = Deno.env.get("SMTP_PORT");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    console.error("SMTP configuration is incomplete");
    return { success: false, error: "SMTP configuration is incomplete" };
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
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    await client.send({
      from: options.from || `GestBarber <${smtpUser}>`,
      to: recipients,
      subject: options.subject,
      content: "auto",
      html: options.html,
    });

    await client.close();
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    await client.close();
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
