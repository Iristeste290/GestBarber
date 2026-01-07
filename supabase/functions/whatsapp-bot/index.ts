import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
};

// Rate limiting store (in-memory, resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 10;

// WhatsApp webhook signature validation
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }
  
  const expectedSignature = signature.slice(7); // Remove 'sha256=' prefix
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const computedSignature = hmac.digest('hex');
  
  return expectedSignature === computedSignature;
}

// Rate limiting check
function checkRateLimit(identifier: string): { allowed: boolean; error?: string } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    // Create new record or reset
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { 
      allowed: false, 
      error: `Limite de requisições excedido. Tente novamente em ${Math.ceil((record.resetTime - now) / 1000)} segundos.` 
    };
  }
  
  record.count++;
  return { allowed: true };
}

// Input validation
function validateAppointmentArgs(args: any): { valid: boolean; error?: string } {
  // Check required fields
  const required = ['service_name', 'barber_name', 'date', 'time', 'client_name', 'client_phone'];
  for (const field of required) {
    if (!args[field] || typeof args[field] !== 'string') {
      return { valid: false, error: `Campo obrigatório ausente ou inválido: ${field}` };
    }
  }
  
  // Validate lengths
  if (args.service_name.length < 1 || args.service_name.length > 100) {
    return { valid: false, error: 'Nome do serviço inválido' };
  }
  if (args.barber_name.length < 1 || args.barber_name.length > 100) {
    return { valid: false, error: 'Nome do barbeiro inválido' };
  }
  if (args.client_name.length < 1 || args.client_name.length > 100) {
    return { valid: false, error: 'Nome do cliente inválido' };
  }
  
  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
    return { valid: false, error: 'Formato de data inválido (use YYYY-MM-DD)' };
  }
  
  // Validate time format (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(args.time)) {
    return { valid: false, error: 'Formato de horário inválido (use HH:MM)' };
  }
  
  // Validate phone format
  if (!/^\+?[1-9]\d{1,14}$/.test(args.client_phone)) {
    return { valid: false, error: 'Formato de telefone inválido' };
  }
  
  // Validate date is in the future
  const appointmentDate = new Date(`${args.date}T${args.time}`);
  if (appointmentDate <= new Date()) {
    return { valid: false, error: 'A data do agendamento deve ser futura' };
  }
  
  // Validate date is within 90 days
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  if (appointmentDate > maxDate) {
    return { valid: false, error: 'Agendamento deve ser em até 90 dias' };
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const WHATSAPP_WEBHOOK_SECRET = Deno.env.get('WHATSAPP_WEBHOOK_SECRET');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const rawBody = await req.text();
    const { message, phone } = JSON.parse(rawBody);

    // Verify webhook signature if secret is configured
    if (WHATSAPP_WEBHOOK_SECRET) {
      const signature = req.headers.get('x-hub-signature-256');
      if (!signature || !verifyWebhookSignature(rawBody, signature, WHATSAPP_WEBHOOK_SECRET)) {
        console.error('Invalid webhook signature from:', phone);
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Rate limiting by phone number
    const rateLimitCheck = checkRateLimit(phone);
    if (!rateLimitCheck.allowed) {
      console.warn('Rate limit exceeded for:', phone);
      return new Response(
        JSON.stringify({ error: rateLimitCheck.error }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received message from:', phone, '- Message:', message);

    // Get available services
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true);

    // Get available barbers
    const { data: barbers } = await supabase
      .from('barbers')
      .select('*')
      .eq('is_active', true);

    // Get work hours for all barbers
    const { data: workHours } = await supabase
      .from('barber_work_hours')
      .select('*');

    // Get breaks for all barbers
    const { data: breaks } = await supabase
      .from('barber_breaks')
      .select('*');

    // Get exceptions (days off) for the next 7 days
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const { data: exceptions } = await supabase
      .from('barber_exceptions')
      .select('*')
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', nextWeek.toISOString().split('T')[0]);

    // Get today's and tomorrow's appointments to check availability
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*, barbers(name), services(name, duration_minutes)')
      .in('appointment_date', [todayStr, tomorrowStr])
      .neq('status', 'cancelled');

    // Helper to get weekday name in Portuguese
    const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    // Format barber availability info
    const formatBarberAvailability = (barber: any) => {
      const barberWorkHours = workHours?.filter(wh => wh.barber_id === barber.id) || [];
      const barberBreaks = breaks?.filter(b => b.barber_id === barber.id) || [];
      const barberExceptions = exceptions?.filter(e => e.barber_id === barber.id) || [];
      
      if (barberWorkHours.length === 0) {
        return `- ${barber.name}${barber.specialty ? ` (${barber.specialty})` : ''}: Horários não configurados`;
      }
      
      const scheduleByDay = barberWorkHours.map(wh => {
        const dayBreaks = barberBreaks.filter(b => b.weekday === wh.weekday);
        const breakInfo = dayBreaks.length > 0 
          ? ` (Pausas: ${dayBreaks.map(b => `${b.start_time.slice(0,5)}-${b.end_time.slice(0,5)}`).join(', ')})`
          : '';
        return `${weekdayNames[wh.weekday]}: ${wh.start_time.slice(0,5)}-${wh.end_time.slice(0,5)}${breakInfo}`;
      }).join('; ');
      
      const daysOff = barberExceptions
        .filter(e => e.is_closed)
        .map(e => new Date(e.date).toLocaleDateString('pt-BR'))
        .join(', ');
      
      return `- ${barber.name}${barber.specialty ? ` (${barber.specialty})` : ''}
  Horários: ${scheduleByDay}${daysOff ? `\n  Folgas: ${daysOff}` : ''}`;
    };

    // Format appointments info
    const formatAppointments = () => {
      if (!appointments || appointments.length === 0) return 'Nenhum agendamento';
      
      return appointments.map(a => {
        const barberName = (a as any).barbers?.name || 'Barbeiro';
        const serviceDuration = (a as any).services?.duration_minutes || 30;
        return `${a.appointment_date} ${a.appointment_time} - ${barberName} (${serviceDuration}min)`;
      }).join(', ');
    };

    const currentWeekday = today.getDay();
    const currentTime = today.toTimeString().slice(0, 5);

    const systemPrompt = `Você é um assistente virtual da GestBarber, um sistema completo de gestão para barbearias. Seu objetivo é ajudar clientes a agendar serviços de barbearia.

Data e hora atual: ${today.toLocaleDateString('pt-BR')} ${currentTime} (${weekdayNames[currentWeekday]})

Serviços disponíveis:
${services?.map(s => `- ${s.name}: R$ ${s.price} (${s.duration_minutes} minutos)${s.description ? ` - ${s.description}` : ''}`).join('\n')}

Barbeiros e seus horários de trabalho:
${barbers?.map(formatBarberAvailability).join('\n')}

Agendamentos já marcados (hoje e amanhã):
${formatAppointments()}

Instruções IMPORTANTES:
1. Seja cordial e profissional
2. Apresente os serviços com preços e duração
3. RESPEITE os horários de trabalho de cada barbeiro - NÃO ofereça horários fora do expediente configurado
4. NÃO ofereça horários durante as pausas (almoço, etc.) de cada barbeiro
5. Verifique se o barbeiro trabalha no dia da semana solicitado
6. Verifique se o barbeiro não está de folga na data solicitada
7. Considere a duração do serviço ao sugerir horários (ex: serviço de 45min não pode começar 15min antes do fim do expediente)
8. Evite conflitos com agendamentos existentes
9. Pergunte qual barbeiro o cliente prefere
10. Quando o cliente confirmar, use a função create_appointment para agendar
11. Sempre confirme os detalhes antes de finalizar

Responda de forma natural e amigável em português brasileiro.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_appointment',
              description: 'Criar um novo agendamento na barbearia',
              parameters: {
                type: 'object',
                properties: {
                  service_name: { type: 'string', description: 'Nome do serviço escolhido' },
                  barber_name: { type: 'string', description: 'Nome do barbeiro escolhido' },
                  date: { type: 'string', description: 'Data do agendamento (YYYY-MM-DD)' },
                  time: { type: 'string', description: 'Horário do agendamento (HH:MM)' },
                  client_name: { type: 'string', description: 'Nome do cliente' },
                  client_phone: { type: 'string', description: 'Telefone do cliente' }
                },
                required: ['service_name', 'barber_name', 'date', 'time', 'client_name', 'client_phone']
              }
            }
          }
        ],
        tool_choice: 'auto'
      }),
    });

    const aiResponse = await response.json();
    console.log('AI Response:', JSON.stringify(aiResponse, null, 2));

    const choice = aiResponse.choices?.[0];
    let responseText = choice?.message?.content || 'Desculpe, não consegui processar sua mensagem.';

    // Check if AI wants to call create_appointment function
    if (choice?.message?.tool_calls?.[0]) {
      const toolCall = choice.message.tool_calls[0];
      if (toolCall.function.name === 'create_appointment') {
        let args;
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          console.error('Invalid JSON in function arguments:', e);
          return new Response(
            JSON.stringify({ 
              reply: 'Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log('Creating appointment with args:', args);

        // Validate input
        const validation = validateAppointmentArgs(args);
        if (!validation.valid) {
          console.error('Validation error:', validation.error);
          return new Response(
            JSON.stringify({ 
              reply: `Desculpe, ${validation.error}. Por favor, verifique as informações e tente novamente.` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Find service and barber IDs
        const service = services?.find(s => s.name.toLowerCase() === args.service_name.toLowerCase());
        const barber = barbers?.find(b => b.name.toLowerCase() === args.barber_name.toLowerCase());

        if (!service || !barber) {
          responseText = 'Desculpe, não encontrei esse serviço ou barbeiro. Pode repetir sua escolha?';
        } else {
          // Create a temporary client profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('full_name', args.client_name)
            .single();

          let clientId;
          if (profile) {
            clientId = profile.id;
          } else {
            // Create anonymous profile for WhatsApp bookings
            const { data: newProfile, error } = await supabase.auth.admin.createUser({
              email: `whatsapp_${phone.replace(/\D/g, '')}@gestbarber.temp`,
              password: Math.random().toString(36).slice(-12),
              email_confirm: true,
              user_metadata: {
                full_name: args.client_name,
                phone: args.client_phone,
                source: 'whatsapp'
              }
            });

            if (error || !newProfile.user) {
              console.error('Error creating user:', error);
              responseText = 'Desculpe, houve um erro ao criar seu agendamento. Tente novamente.';
            } else {
              clientId = newProfile.user.id;
            }
          }

          if (clientId) {
            const { data: appointment, error: appointmentError } = await supabase
              .from('appointments')
              .insert({
                client_id: clientId,
                service_id: service.id,
                barber_id: barber.id,
                appointment_date: args.date,
                appointment_time: args.time,
                status: 'confirmed',
                notes: `Agendamento via WhatsApp - ${args.client_phone}`
              })
              .select()
              .single();

            if (appointmentError) {
              console.error('Error creating appointment:', appointmentError);
              responseText = 'Desculpe, houve um erro ao confirmar seu agendamento. Tente novamente.';
            } else {
              responseText = `✅ Agendamento confirmado!\n\n📅 Data: ${new Date(args.date).toLocaleDateString('pt-BR')}\n⏰ Horário: ${args.time}\n💈 Serviço: ${service.name}\n👨‍🦰 Barbeiro: ${barber.name}\n💰 Valor: R$ ${service.price}\n\nNos vemos em breve! 😊`;
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in whatsapp-bot function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
