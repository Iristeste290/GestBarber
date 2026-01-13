import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting Growth Engine Sync...");

    // Get all users with barbers
    const { data: barbers, error: barbersError } = await supabase
      .from("barbers")
      .select("id, user_id, name")
      .not("user_id", "is", null);

    if (barbersError) throw barbersError;

    const userIds = [...new Set(barbers?.map(b => b.user_id).filter(Boolean))];
    
    for (const userId of userIds) {
      console.log(`Processing user: ${userId}`);
      
      // 1️⃣ DETECT EMPTY SLOTS FOR TODAY
      const today = new Date().toISOString().split('T')[0];
      const userBarbers = barbers?.filter(b => b.user_id === userId) || [];
      
      for (const barber of userBarbers) {
        // Get barber work hours for today's weekday
        const weekday = new Date().getDay();
        const { data: workHours } = await supabase
          .from("barber_work_hours")
          .select("start_time, end_time")
          .eq("barber_id", barber.id)
          .eq("weekday", weekday);

        if (!workHours || workHours.length === 0) continue;

        // Get today's appointments
        const { data: appointments } = await supabase
          .from("appointments")
          .select("appointment_time, duration_minutes, status")
          .eq("barber_id", barber.id)
          .eq("appointment_date", today)
          .in("status", ["pending", "confirmed", "completed"]);

        // Generate all possible time slots (30 min intervals)
        const slots: string[] = [];
        for (const wh of workHours) {
          let current = wh.start_time;
          while (current < wh.end_time) {
            slots.push(current);
            const [h, m] = current.split(":").map(Number);
            const nextMin = m + 30;
            if (nextMin >= 60) {
              current = `${String(h + 1).padStart(2, "0")}:00:00`;
            } else {
              current = `${String(h).padStart(2, "0")}:${String(nextMin).padStart(2, "0")}:00`;
            }
          }
        }

        // Find empty slots
        const bookedTimes = appointments?.map(a => a.appointment_time) || [];
        const emptySlots = slots.filter(s => !bookedTimes.includes(s));

        // Insert empty slots
        for (const slot of emptySlots) {
          await supabase
            .from("empty_slots")
            .upsert({
              user_id: userId,
              barber_id: barber.id,
              slot_date: today,
              slot_time: slot,
              status: "open"
            }, { onConflict: "barber_id,slot_date,slot_time" });
        }
      }

      // 3️⃣ REACTIVATION QUEUE - Find inactive clients (30+ days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: inactiveClients } = await supabase
        .from("client_behavior")
        .select("client_id, client_name, client_phone, last_appointment_date, classification")
        .eq("user_id", userId)
        .neq("classification", "bloqueado")
        .lt("last_appointment_date", thirtyDaysAgo.toISOString().split('T')[0]);

      for (const client of inactiveClients || []) {
        const daysInactive = Math.floor(
          (Date.now() - new Date(client.last_appointment_date).getTime()) / (1000 * 60 * 60 * 24)
        );

        await supabase
          .from("reactivation_queue")
          .upsert({
            client_id: client.client_id,
            user_id: userId,
            client_name: client.client_name,
            client_phone: client.client_phone,
            days_inactive: daysInactive,
            last_appointment_date: client.last_appointment_date,
            status: "pending"
          }, { onConflict: "client_id,user_id" });
      }

      // 5️⃣ MONEY LOST ALERTS
      const { data: todaySlots } = await supabase
        .from("empty_slots")
        .select("id")
        .eq("user_id", userId)
        .eq("slot_date", today)
        .eq("status", "open");

      const { data: todayCancels } = await supabase
        .from("appointments")
        .select("id, service_id")
        .eq("appointment_date", today)
        .eq("status", "cancelled")
        .in("barber_id", userBarbers.map(b => b.id));

      const { data: todayNoShows } = await supabase
        .from("appointments")
        .select("id, service_id")
        .eq("appointment_date", today)
        .eq("status", "no_show")
        .in("barber_id", userBarbers.map(b => b.id));

      const { data: todayTotal } = await supabase
        .from("appointments")
        .select("id")
        .eq("appointment_date", today)
        .in("barber_id", userBarbers.map(b => b.id));

      const emptySlotsCount = todaySlots?.length || 0;
      const cancelsCount = todayCancels?.length || 0;
      const noShowsCount = todayNoShows?.length || 0;
      const totalToday = todayTotal?.length || 0;
      const cancelRate = totalToday > 0 ? (cancelsCount / totalToday) * 100 : 0;
      
      // Estimate loss (assuming avg service price of 50)
      const estimatedLoss = (emptySlotsCount + cancelsCount + noShowsCount) * 50;
      const isCritical = cancelRate > 30 || emptySlotsCount > 3;

      if (emptySlotsCount > 0 || cancelsCount > 0 || noShowsCount > 0) {
        await supabase
          .from("money_lost_alerts")
          .upsert({
            user_id: userId,
            alert_date: today,
            empty_slots_count: emptySlotsCount,
            cancellations_count: cancelsCount,
            no_shows_count: noShowsCount,
            estimated_loss: estimatedLoss,
            cancel_rate: cancelRate,
            is_critical: isCritical,
            is_dismissed: false
          }, { onConflict: "user_id,alert_date" });
      }
    }

    console.log("Growth Engine Sync completed successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Growth Engine sync completed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in Growth Engine Sync:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
