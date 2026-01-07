import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const isTest = body.test === true;
    const testUserId = body.user_id;

    console.log(`Executando verificação de clientes inativos${isTest ? " (TESTE)" : ""}`);

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let totalSent = 0;
    let totalErrors = 0;

    // Buscar todas as barbearias com automação ativada
    let query = supabase
      .from("automation_settings")
      .select("*")
      .eq("inactive_clients_enabled", true);

    if (isTest && testUserId) {
      query = query.eq("user_id", testUserId);
    }

    const { data: automationSettings, error: settingsError } = await query;

    if (settingsError) {
      throw settingsError;
    }

    console.log(`Encontradas ${automationSettings?.length || 0} barbearias com automação ativa`);

    // Processar cada barbearia
    for (const settings of automationSettings || []) {
      console.log(`Processando barbearia: ${settings.user_id}`);

      try {
        // Verificar se tem WhatsApp configurado
        const { data: whatsappSettings } = await supabase
          .from("whatsapp_settings")
          .select("*")
          .eq("user_id", settings.user_id)
          .eq("is_active", true)
          .single();

        if (!whatsappSettings) {
          console.log(`WhatsApp não configurado para ${settings.user_id}, pulando...`);
          continue;
        }

        // Calcular data limite de inatividade
        const inactiveSince = new Date();
        inactiveSince.setDate(inactiveSince.getDate() - settings.inactive_days_threshold);
        const inactiveSinceStr = inactiveSince.toISOString().split('T')[0];

        // Buscar todos os clientes que fizeram agendamentos
        const { data: allAppointments } = await supabase
          .from("appointments")
          .select("client_id, profiles!appointments_client_id_fkey(id, full_name)");

        if (!allAppointments || allAppointments.length === 0) {
          console.log(`Nenhum agendamento encontrado para ${settings.user_id}`);
          continue;
        }

        // Buscar agendamentos concluídos recentes
        const { data: recentAppointments } = await supabase
          .from("appointments")
          .select("client_id")
          .eq("status", "completed")
          .gte("appointment_date", inactiveSinceStr);

        const activeClientIds = new Set(recentAppointments?.map(a => a.client_id) || []);

        // Identificar clientes inativos
        const inactiveClients = allAppointments
          .filter((app: any) => !activeClientIds.has(app.client_id) && app.profiles)
          .reduce((acc: any[], app: any) => {
            if (!acc.find(c => c.id === app.profiles.id)) {
              acc.push({
                id: app.profiles.id,
                name: app.profiles.full_name,
              });
            }
            return acc;
          }, []);

        console.log(`Clientes inativos encontrados: ${inactiveClients.length}`);

        // Verificar logs de envio de hoje para evitar duplicatas
        const today = new Date().toISOString().split('T')[0];
        const { data: todaysLogs } = await supabase
          .from("automation_logs")
          .select("client_id")
          .eq("user_id", settings.user_id)
          .eq("type", "inactive_clients")
          .gte("sent_at", `${today}T00:00:00`);

        const sentTodayClientIds = new Set(todaysLogs?.map(log => log.client_id) || []);

        // Enviar mensagens para clientes inativos
        for (const client of inactiveClients) {
          // Pular se já enviou hoje (exceto em modo de teste)
          if (!isTest && sentTodayClientIds.has(client.id)) {
            console.log(`Mensagem já enviada hoje para ${client.name}, pulando...`);
            continue;
          }

          // Personalizar mensagem com nome do cliente
          const personalizedMessage = settings.inactive_clients_message.replace(
            /{nome}/g,
            client.name
          );

          // Para este exemplo, vou assumir um número de telefone fictício
          // Em produção, você deve ter o telefone armazenado no perfil do cliente
          const phone = "5511999999999"; // Substituir por client.phone quando disponível

          try {
            // Enviar via função de WhatsApp
            const { data: sendResult, error: sendError } = await supabase.functions.invoke(
              "send-whatsapp-message",
              {
                body: {
                  userId: settings.user_id,
                  phone: phone,
                  message: personalizedMessage,
                },
              }
            );

            if (sendError) {
              throw sendError;
            }

            // Registrar log de sucesso
            await supabase.from("automation_logs").insert({
              user_id: settings.user_id,
              client_id: client.id,
              phone: phone,
              message: personalizedMessage,
              type: "inactive_clients",
              status: "sent",
            });

            totalSent++;
            console.log(`Mensagem enviada para ${client.name}`);
          } catch (sendError: any) {
            console.error(`Erro ao enviar para ${client.name}:`, sendError);

            // Registrar log de erro
            await supabase.from("automation_logs").insert({
              user_id: settings.user_id,
              client_id: client.id,
              phone: phone,
              message: personalizedMessage,
              type: "inactive_clients",
              status: "error",
              error_message: sendError.message,
            });

            totalErrors++;
          }
        }
      } catch (barbershopError: any) {
        console.error(`Erro ao processar barbearia ${settings.user_id}:`, barbershopError);
        totalErrors++;
      }
    }

    const result = {
      success: true,
      sent: totalSent,
      errors: totalErrors,
      message: `Processamento concluído. ${totalSent} mensagens enviadas, ${totalErrors} erros.`,
    };

    console.log("Resultado final:", result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Erro na função check-inactive-clients:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
