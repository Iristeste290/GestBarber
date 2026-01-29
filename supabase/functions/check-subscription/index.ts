import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Buscar customer pelo email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan: null,
        status: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Buscar assinaturas ativas
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Verificar assinaturas pendentes/recentes (pode estar processando)
      const recentSubs = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
      });

      if (recentSubs.data.length > 0) {
        const sub = recentSubs.data[0];
        logStep("Found recent subscription", { status: sub.status, id: sub.id });
        
        // Se está processando ou incompleta, retornar status apropriado
        if (sub.status === "incomplete" || sub.status === "past_due") {
          return new Response(JSON.stringify({ 
            subscribed: false,
            plan: null,
            status: sub.status,
            message: "Pagamento em processamento"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }

      logStep("No active subscription found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan: null,
        status: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    
    // Determinar o plano baseado no price ID
    let plan = "mensal";
    if (priceId === "price_1SX074KtuTWnHVngd5iTQf1k") {
      plan = "anual";
    }

    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    logStep("Active subscription found", { 
      subscriptionId: subscription.id, 
      plan,
      endDate: subscriptionEnd 
    });

    // Atualizar a tabela subscriptions no Supabase
    const { error: upsertError } = await supabaseClient
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        plan_type: plan,
        status: "active",
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: subscriptionEnd,
        start_date: new Date(subscription.start_date * 1000).toISOString(),
        end_date: subscriptionEnd,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id"
      });

    if (upsertError) {
      logStep("Error updating subscription in database", { error: upsertError.message });
    } else {
      logStep("Subscription updated in database");
    }

    return new Response(JSON.stringify({
      subscribed: true,
      plan,
      status: "active",
      subscription_end: subscriptionEnd,
      customer_id: customerId,
      subscription_id: subscription.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
