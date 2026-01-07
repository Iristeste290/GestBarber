import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      barberId,
      appointmentId,
      customerName,
      phone,
      barberName,
      serviceName,
      date,
      time,
      price,
    } = await req.json();

    console.log("Sending appointment confirmation for:", {
      barberId,
      appointmentId,
      customerName,
      phone,
      serviceName,
      date,
      time,
    });

    // Get barber's user_id to send push notification
    const { data: barber, error: barberError } = await supabase
      .from("barbers")
      .select("user_id, name")
      .eq("id", barberId)
      .single();

    if (barberError) {
      console.error("Error fetching barber:", barberError);
    }

    const results = {
      pushNotification: false,
      inAppNotification: false,
      whatsappToClient: false,
    };

    // Send push notification to barber (owner)
    if (barber?.user_id) {
      try {
        const { error: pushError } = await supabase.functions.invoke(
          "send-push-notification",
          {
            body: {
              userId: barber.user_id,
              title: "🗓️ Novo Agendamento!",
              body: `${customerName} agendou ${serviceName} para ${date} às ${time}`,
              icon: "/icon-192.png",
              data: {
                appointmentId: appointmentId,
                type: "new_appointment",
              },
            },
          }
        );

        if (!pushError) {
          results.pushNotification = true;
          console.log("Push notification sent successfully");
        } else {
          console.error("Push notification error:", pushError);
        }
      } catch (pushErr) {
        console.error("Error sending push notification:", pushErr);
      }
    }

    // Create in-app notification for the barber
    if (barber?.user_id) {
      try {
        await supabase.from("notifications").insert({
          user_id: barber.user_id,
          title: "Novo Agendamento",
          message: `${customerName} agendou ${serviceName} para ${date} às ${time}. Valor: R$ ${price}`,
          type: "appointment",
          link: "/agenda",
        });
        results.inAppNotification = true;
        console.log("In-app notification created");
      } catch (notifErr) {
        console.error("Error creating in-app notification:", notifErr);
      }
    }

    // Send WhatsApp confirmation to the CLIENT (if barber has WhatsApp configured)
    if (barber?.user_id && phone) {
      try {
        // Check if barber has WhatsApp configured
        const { data: whatsappSettings, error: settingsError } = await supabase
          .from("whatsapp_settings")
          .select("*")
          .eq("user_id", barber.user_id)
          .eq("is_active", true)
          .maybeSingle();

        if (settingsError) {
          console.error("Error fetching WhatsApp settings:", settingsError);
        }

        if (whatsappSettings?.api_url && whatsappSettings?.api_token && whatsappSettings?.whatsapp_number) {
          console.log("WhatsApp configured, sending confirmation to client...");

          // Build confirmation message for the client
          let clientMessage = "";
          
          if (whatsappSettings.appointment_message_template) {
            clientMessage = whatsappSettings.appointment_message_template
              .replace("{nome}", customerName || "")
              .replace("{barbeiro}", barberName || barber.name || "")
              .replace("{servico}", serviceName || "")
              .replace("{data}", date || "")
              .replace("{horario}", time || "")
              .replace("{preco}", price || "");
          } else {
            // Default confirmation message
            clientMessage = `✅ *Agendamento Confirmado!*\n\nOlá *${customerName}*!\n\nSeu agendamento foi realizado com sucesso:\n\n👤 Barbeiro: ${barberName || barber.name}\n✂️ Serviço: ${serviceName}\n📅 Data: ${date}\n⏰ Horário: ${time}\n💰 Valor: R$ ${price}\n\nAguardamos você! 😊`;
          }

          // Format phone number
          const cleanPhone = phone.replace(/\D/g, "");
          const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

          console.log(`Sending WhatsApp to client: ${formattedPhone}`);

          // Send WhatsApp message via the configured API
          const whatsappResponse = await fetch(whatsappSettings.api_url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: whatsappSettings.api_token,
              to: formattedPhone,
              body: clientMessage,
            }),
          });

          const whatsappData = await whatsappResponse.json();

          if (whatsappResponse.ok) {
            results.whatsappToClient = true;
            console.log("WhatsApp sent to client successfully:", whatsappData);
          } else {
            console.error("Error sending WhatsApp to client:", whatsappData);
          }
        } else {
          console.log("WhatsApp not configured for this barber, skipping client notification");
        }
      } catch (whatsappErr) {
        console.error("Error sending WhatsApp to client:", whatsappErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: "Confirmation notifications sent",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Error in send-appointment-confirmation:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
