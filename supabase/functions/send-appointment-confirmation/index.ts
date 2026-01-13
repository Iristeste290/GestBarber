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

    console.log("Sending appointment notification to barber:", {
      barberId,
      appointmentId,
      customerName,
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
          console.log("Push notification sent successfully to barber");
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
          message: `${customerName} agendou ${serviceName} para ${date} às ${time}. Valor: R$ ${price}. Tel: ${phone}`,
          type: "appointment",
          link: "/agenda",
        });
        results.inAppNotification = true;
        console.log("In-app notification created for barber");
      } catch (notifErr) {
        console.error("Error creating in-app notification:", notifErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: "Barber notifications sent successfully",
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
