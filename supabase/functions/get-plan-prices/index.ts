import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const priceIds = [
      'price_1SX04CKtuTWnHVngnvYdIlzZ', // Mensal
      'price_1SX074KtuTWnHVngd5iTQf1k', // Anual
    ];

    const prices = await Promise.all(
      priceIds.map(id => stripe.prices.retrieve(id, { expand: ['product'] }))
    );

    const formattedPrices = prices.map((price: Stripe.Price) => ({
      id: price.id,
      amount: price.unit_amount || 0,
      currency: price.currency,
      nickname: price.nickname,
      product: typeof price.product === 'string' ? price.product : price.product?.name,
      recurring: price.recurring,
    }));

    return new Response(
      JSON.stringify(formattedPrices),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao buscar preços:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
