import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Barber {
  id: string;
  name: string;
  is_active: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    console.log('Iniciando geração de metas semanais...');

    // Calcular datas da semana (segunda a domingo)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekStartDate = monday.toISOString().split('T')[0];
    const weekEndDate = sunday.toISOString().split('T')[0];

    console.log(`Semana: ${weekStartDate} até ${weekEndDate}`);

    // Buscar barbeiros ativos
    const { data: barbers, error: barbersError } = await supabaseClient
      .from('barbers')
      .select('id, name, is_active')
      .eq('is_active', true);

    if (barbersError) {
      console.error('Erro ao buscar barbeiros:', barbersError);
      throw barbersError;
    }

    if (!barbers || barbers.length === 0) {
      console.log('Nenhum barbeiro ativo encontrado');
      return new Response(
        JSON.stringify({ message: 'Nenhum barbeiro ativo encontrado', goals: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Encontrados ${barbers.length} barbeiros ativos`);

    const goalsToCreate = [];

    for (const barber of barbers) {
      // Verificar se já existe meta para esta semana
      const { data: existingGoal } = await supabaseClient
        .from('barber_goals')
        .select('id')
        .eq('barber_id', barber.id)
        .eq('week_start_date', weekStartDate)
        .single();

      if (existingGoal) {
        console.log(`Meta já existe para ${barber.name} nesta semana`);
        continue;
      }

      // Calcular médias históricas (últimas 4 semanas)
      const fourWeeksAgo = new Date(monday);
      fourWeeksAgo.setDate(monday.getDate() - 28);
      const fourWeeksAgoStr = fourWeeksAgo.toISOString().split('T')[0];

      const { data: historicalAppointments } = await supabaseClient
        .from('appointments')
        .select('id, service_id, services(price)')
        .eq('barber_id', barber.id)
        .eq('status', 'completed')
        .gte('appointment_date', fourWeeksAgoStr)
        .lt('appointment_date', weekStartDate);

      let targetHaircuts = 20; // padrão
      let targetAvgTicket = 50; // padrão

      if (historicalAppointments && historicalAppointments.length > 0) {
        const avgPerWeek = historicalAppointments.length / 4;
        targetHaircuts = Math.ceil(avgPerWeek * 1.1); // meta 10% acima da média

        const totalRevenue = historicalAppointments.reduce((sum, apt: any) => {
          return sum + (apt.services?.price || 0);
        }, 0);
        const avgTicket = totalRevenue / historicalAppointments.length;
        targetAvgTicket = Math.ceil(avgTicket * 1.05); // meta 5% acima da média
      }

      goalsToCreate.push({
        barber_id: barber.id,
        week_start_date: weekStartDate,
        week_end_date: weekEndDate,
        target_haircuts: targetHaircuts,
        target_avg_ticket: targetAvgTicket,
        target_product_sales: 200, // padrão por enquanto
        current_haircuts: 0,
        current_avg_ticket: 0,
        current_product_sales: 0,
      });

      console.log(`Meta criada para ${barber.name}: ${targetHaircuts} cortes, R$ ${targetAvgTicket} ticket médio`);
    }

    // Inserir todas as metas
    if (goalsToCreate.length > 0) {
      const { data: createdGoals, error: insertError } = await supabaseClient
        .from('barber_goals')
        .insert(goalsToCreate)
        .select();

      if (insertError) {
        console.error('Erro ao inserir metas:', insertError);
        throw insertError;
      }

      console.log(`${createdGoals?.length || 0} metas criadas com sucesso`);

      return new Response(
        JSON.stringify({
          message: 'Metas semanais geradas com sucesso',
          goals: createdGoals,
          count: createdGoals?.length || 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Nenhuma meta nova criada', goals: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Erro na geração de metas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
