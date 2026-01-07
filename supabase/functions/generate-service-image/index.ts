import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { serviceName } = await req.json();
    
    if (!serviceName) {
      throw new Error('Nome do serviço é obrigatório');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Analisar o nome do serviço para criar prompt específico
    const serviceNameLower = serviceName.toLowerCase();
    let specificFocus = '';
    let specificElements = '';

    // Identificar tipo de serviço e criar foco específico
    if (serviceNameLower.includes('barba')) {
      specificFocus = 'barba masculina bem aparada e modelada';
      specificElements = 'navalha profissional de barbeiro, espuma de barbear premium, óleo de barba, close-up de barba sendo alinhada com precisão, detalhes de pelos faciais bem cuidados';
    } else if (serviceNameLower.includes('corte') && (serviceNameLower.includes('masculino') || serviceNameLower.includes('homem'))) {
      specificFocus = 'corte de cabelo masculino moderno';
      specificElements = 'máquina de corte profissional, fade impecável, pente de barbeiro, tesouras de precisão, cabelo masculino sendo cortado com técnica, degradê perfeito';
    } else if (serviceNameLower.includes('corte') && (serviceNameLower.includes('feminino') || serviceNameLower.includes('mulher'))) {
      specificFocus = 'corte de cabelo feminino elegante';
      specificElements = 'tesouras de cabeleireiro profissional, escova de alta qualidade, secador premium, cabelo longo feminino sendo finalizado, prancha profissional, produtos de finishing';
    } else if (serviceNameLower.includes('hidrata') || serviceNameLower.includes('tratamento')) {
      specificFocus = 'tratamento capilar profissional';
      specificElements = 'produtos premium de tratamento, ampolas, cremes profissionais, cabelo sendo tratado, textura sedosa, brilho natural';
    } else if (serviceNameLower.includes('coloração') || serviceNameLower.includes('tintura') || serviceNameLower.includes('luzes')) {
      specificFocus = 'coloração capilar profissional';
      specificElements = 'tintura profissional, pincel aplicador, papel alumínio, mechas sendo aplicadas, cores vibrantes, resultado impecável';
    } else if (serviceNameLower.includes('sobrancelha') || serviceNameLower.includes('design')) {
      specificFocus = 'design de sobrancelha preciso';
      specificElements = 'pinça profissional, henna, régua de medição, sobrancelha sendo modelada, simetria perfeita, resultado natural';
    } else if (serviceNameLower.includes('unha') || serviceNameLower.includes('manicure')) {
      specificFocus = 'manicure profissional';
      specificElements = 'esmaltes premium, alicate profissional, lixa, unhas sendo cuidadas, resultado impecável, mãos elegantes';
    } else if (serviceNameLower.includes('massagem') || serviceNameLower.includes('relaxante')) {
      specificFocus = 'massagem relaxante profissional';
      specificElements = 'óleos essenciais, ambiente zen, mãos profissionais massageando, atmosfera tranquila, pedras quentes';
    } else {
      // Genérico mas focado em barbearia/salão
      specificFocus = 'serviço profissional de barbearia/salão';
      specificElements = 'ferramentas profissionais de barbeiro/cabeleireiro, ambiente premium, detalhes de qualidade superior';
    }

    // Criar prompt personalizado e específico
    const prompt = `Fotografia profissional comercial em alta qualidade, estilo editorial de revista premium. Tema principal: ${specificFocus}. Foco visual específico em: ${specificElements}. Composição minimalista e elegante com iluminação cinematográfica suave e dramática. Paleta de cores neutra e sofisticada (tons de cinza escuro, preto profundo, branco puro, detalhes em dourado sutil ou azul petróleo). Fundo completamente desfocado com bokeh elegante ou degradê neutro limpo. Estilo fotográfico realista de alta resolução, sem elementos cartunizados, sem cores vibrantes artificiais, sem aparência infantil. Aesthetic premium de salão/barbearia de luxo. Apenas elementos que representem diretamente o serviço "${serviceName}", sem itens genéricos irrelevantes.`;
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API de imagem:', response.status, errorText);
      throw new Error('Erro ao gerar imagem');
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error('Nenhuma imagem foi gerada');
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro em generate-service-image:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
