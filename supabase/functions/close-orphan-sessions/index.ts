import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting daily cash session close...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar TODAS as sessões abertas (não apenas órfãs)
    const { data: openSessions, error: fetchError } = await supabase
      .from("cash_register_sessions")
      .select("id, user_id, opened_at, opening_amount")
      .eq("is_open", true);

    if (fetchError) {
      console.error("Error fetching open sessions:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${openSessions?.length || 0} open sessions`);

    if (!openSessions || openSessions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No open sessions found",
          closedCount: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fechar todas as sessões abertas
    const sessionIds = openSessions.map(s => s.id);
    
    const { error: updateError } = await supabase
      .from("cash_register_sessions")
      .update({
        is_open: false,
        closed_at: new Date().toISOString(),
        notes: "Fechado automaticamente à meia-noite"
      })
      .in("id", sessionIds);

    if (updateError) {
      console.error("Error closing sessions:", updateError);
      throw updateError;
    }

    console.log(`Successfully closed ${sessionIds.length} sessions`);

    // Criar notificações para os usuários afetados
    const uniqueUserIds = [...new Set(openSessions.map(s => s.user_id))];
    
    for (const userId of uniqueUserIds) {
      const userSessions = openSessions.filter(s => s.user_id === userId);
      
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Caixa fechado automaticamente",
        message: `${userSessions.length} sessão(ões) de caixa foram fechadas automaticamente à meia-noite.`,
        type: "info",
        link: "/caixa"
      });
      
      console.log(`Notification sent to user: ${userId}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Closed ${sessionIds.length} sessions at midnight`,
        closedCount: sessionIds.length,
        notifiedUsers: uniqueUserIds.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in close-orphan-sessions:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting orphan sessions cleanup...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar sessões órfãs (abertas há mais de 24 horas)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString();

    console.log(`Looking for sessions opened before: ${yesterdayISO}`);

    // Primeiro, buscar as sessões órfãs
    const { data: orphanSessions, error: fetchError } = await supabase
      .from("cash_register_sessions")
      .select("id, user_id, opened_at, opening_amount")
      .eq("is_open", true)
      .lt("opened_at", yesterdayISO);

    if (fetchError) {
      console.error("Error fetching orphan sessions:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${orphanSessions?.length || 0} orphan sessions`);

    if (!orphanSessions || orphanSessions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No orphan sessions found",
          closedCount: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fechar cada sessão órfã
    const sessionIds = orphanSessions.map(s => s.id);
    
    const { error: updateError, count } = await supabase
      .from("cash_register_sessions")
      .update({
        is_open: false,
        closed_at: new Date().toISOString(),
        notes: "Fechado automaticamente - sessão órfã (mais de 24h aberta)"
      })
      .in("id", sessionIds);

    if (updateError) {
      console.error("Error closing orphan sessions:", updateError);
      throw updateError;
    }

    console.log(`Successfully closed ${sessionIds.length} orphan sessions`);

    // Criar notificações para os usuários afetados
    const uniqueUserIds = [...new Set(orphanSessions.map(s => s.user_id))];
    
    for (const userId of uniqueUserIds) {
      const userSessions = orphanSessions.filter(s => s.user_id === userId);
      
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Sessão de caixa fechada automaticamente",
        message: `${userSessions.length} sessão(ões) de caixa foram fechadas automaticamente por estarem abertas há mais de 24 horas.`,
        type: "warning",
        link: "/caixa"
      });
      
      console.log(`Notification sent to user: ${userId}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Closed ${sessionIds.length} orphan sessions`,
        closedCount: sessionIds.length,
        notifiedUsers: uniqueUserIds.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in close-orphan-sessions:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
