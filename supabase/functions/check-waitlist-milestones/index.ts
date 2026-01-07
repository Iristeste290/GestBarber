import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Milestone thresholds to notify
const MILESTONES = [10, 25, 50, 100];

// Admin email to receive notifications
const ADMIN_EMAIL = "gustavojordand7@gmail.com";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-WAITLIST-MILESTONES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get waitlist counts by feature
    const { data: waitlistData, error: waitlistError } = await supabaseClient
      .from("feature_waitlist")
      .select("feature_name");

    if (waitlistError) {
      throw new Error(`Error fetching waitlist: ${waitlistError.message}`);
    }

    // Count signups per feature
    const featureCounts: Record<string, number> = {};
    waitlistData?.forEach((item) => {
      featureCounts[item.feature_name] = (featureCounts[item.feature_name] || 0) + 1;
    });

    logStep("Feature counts", featureCounts);

    // Check for milestones reached
    const notificationsSent: string[] = [];

    for (const [featureName, count] of Object.entries(featureCounts)) {
      for (const milestone of MILESTONES) {
        if (count >= milestone) {
          // Check if we already sent a notification for this milestone
          const notificationKey = `waitlist_${featureName}_${milestone}`;
          
          const { data: existingNotification } = await supabaseClient
            .from("notifications")
            .select("id")
            .eq("title", notificationKey)
            .limit(1)
            .maybeSingle();

          if (!existingNotification) {
            logStep(`Milestone reached: ${featureName} hit ${milestone} signups`);

            // Send email notification
            try {
              const emailResponse = await resend.emails.send({
                from: "GestBarber <onboarding@resend.dev>",
                to: [ADMIN_EMAIL],
                subject: `🎉 Milestone: ${featureName} atingiu ${milestone}+ inscritos!`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #f59e0b;">🎉 Milestone Atingido!</h1>
                    <p style="font-size: 18px;">O recurso <strong>${featureName}</strong> atingiu <strong>${milestone}+ inscritos</strong> na waitlist!</p>
                    
                    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h2 style="margin: 0; color: #92400e;">📊 Estatísticas Atuais</h2>
                      <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${count} inscritos</p>
                    </div>
                    
                    <p>Considere priorizar o desenvolvimento deste recurso!</p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                    <p style="color: #6b7280; font-size: 12px;">GestBarber - Sistema de Gestão para Barbearias</p>
                  </div>
                `,
              });

              logStep("Email sent", { featureName, milestone, emailResponse });
            } catch (emailError) {
              logStep("Email error", { error: emailError });
            }

            // Create a notification record to prevent duplicate emails
            // Using a system notification with special title as marker
            await supabaseClient
              .from("notifications")
              .insert({
                user_id: "00000000-0000-0000-0000-000000000000", // System user placeholder
                title: notificationKey,
                message: `${featureName} atingiu ${milestone} inscritos na waitlist`,
                type: "milestone",
              });

            notificationsSent.push(`${featureName}: ${milestone}`);
          }
        }
      }
    }

    logStep("Function completed", { notificationsSent });

    return new Response(
      JSON.stringify({
        success: true,
        featureCounts,
        notificationsSent,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
