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
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, barberId, phone, message, appointmentData } = await req.json();

    if ((!userId && !barberId) || !phone) {
      throw new Error("Parâmetros obrigatórios: (userId ou barberId), phone");
    }

    // Create authenticated Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for privileged operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    let effectiveUserId = userId;

    // Se barberId foi fornecido, buscar o user_id do barbeiro
    if (!effectiveUserId && barberId) {
      console.log(`Buscando user_id do barbeiro ${barberId}`);
      const { data: barberData, error: barberError } = await supabaseService
        .from("barbers")
        .select("user_id")
        .eq("id", barberId)
        .single();

      if (barberError || !barberData?.user_id) {
        console.error("Erro ao buscar barbeiro:", barberError);
        throw new Error("Barbeiro não encontrado ou sem usuário associado");
      }

      effectiveUserId = barberData.user_id;
      console.log(`User ID encontrado: ${effectiveUserId}`);
    }

    // Authorization check: Verify the authenticated user owns this account
    if (effectiveUserId !== user.id) {
      // Check if user is a barber who owns this barber_id
      if (barberId) {
        const { data: barberOwnership, error: ownershipError } = await supabaseService
          .from("barbers")
          .select("user_id")
          .eq("id", barberId)
          .eq("user_id", user.id)
          .single();

        if (ownershipError || !barberOwnership) {
          console.error("Authorization failed: User does not own this barber account");
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Forbidden: You do not have permission to send messages for this account' 
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.error("Authorization failed: User ID mismatch");
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Forbidden: You can only send messages from your own account' 
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Buscar configurações do WhatsApp (usando service role para lookup)
    const { data: whatsappSettings, error: settingsError } = await supabaseService
      .from("whatsapp_settings")
      .select("*")
      .eq("user_id", effectiveUserId)
      .eq("is_active", true)
      .maybeSingle();
    
    console.log("Configurações WhatsApp:", whatsappSettings);

    if (settingsError) {
      console.error("Erro ao buscar configurações:", settingsError);
      throw new Error("Erro ao buscar configurações do WhatsApp");
    }

    if (!whatsappSettings) {
      console.log("WhatsApp não configurado para o usuário:", effectiveUserId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "WhatsApp não configurado para esta barbearia",
          configured: false
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar se tem as configurações necessárias
    if (!whatsappSettings.whatsapp_number || !whatsappSettings.api_token || !whatsappSettings.api_url) {
      console.error("Configurações incompletas do WhatsApp");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Configurações incompletas do WhatsApp. Configure número, token e URL da API.",
          configured: false
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Processar mensagem: usar template se appointmentData foi fornecido
    let finalMessage = message;
    
    if (appointmentData && whatsappSettings.appointment_message_template) {
      finalMessage = whatsappSettings.appointment_message_template
        .replace('{nome}', appointmentData.nome || '')
        .replace('{barbeiro}', appointmentData.barbeiro || '')
        .replace('{servico}', appointmentData.servico || '')
        .replace('{data}', appointmentData.data || '')
        .replace('{horario}', appointmentData.horario || '')
        .replace('{preco}', appointmentData.preco || '');
      
      console.log("Usando template de mensagem personalizado");
    } else if (appointmentData) {
      // Fallback se não houver template configurado
      finalMessage = `✅ *Agendamento Confirmado!*\n\nOlá *${appointmentData.nome}*!\n\nSeu agendamento foi realizado com sucesso:\n\n👤 Barbeiro: ${appointmentData.barbeiro}\n✂️ Serviço: ${appointmentData.servico}\n📅 Data: ${appointmentData.data}\n⏰ Horário: ${appointmentData.horario}\n💰 Valor: R$ ${appointmentData.preco}\n\nAguardamos você! 😊`;
      console.log("Usando template padrão de agendamento");
    }

    // Formatar o número de telefone
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    console.log(`Enviando mensagem para ${formattedPhone} usando API: ${whatsappSettings.api_url}`);

    // Enviar usando a URL configurada pelo usuário
    const whatsappResponse = await fetch(
      whatsappSettings.api_url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: whatsappSettings.api_token,
          to: formattedPhone,
          body: finalMessage,
        }),
      }
    );

    const whatsappData = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error("Erro ao enviar mensagem:", whatsappData);
      throw new Error(whatsappData.error || "Erro ao enviar mensagem");
    }

    console.log("Mensagem enviada com sucesso:", whatsappData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: whatsappData.id,
        data: whatsappData,
        configured: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Erro na função send-whatsapp-message:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        configured: true
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
