import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const MAX_PAYLOAD_SIZE = 1_000; // 1KB max

const RegisterInputSchema = z.object({
  userId: z.string()
    .uuid("ID de usuário inválido")
    .min(1, "ID de usuário é obrigatório"),
  device_id: z.string()
    .max(200, "Device ID muito longo")
    .optional()
    .nullable()
    .transform(val => val || null),
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check payload size
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return new Response(
        JSON.stringify({ success: false, error: "Payload muito grande" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 413 }
      );
    }

    // Parse and validate input
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "JSON inválido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const validationResult = RegisterInputSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => e.message).join(", ");
      return new Response(
        JSON.stringify({ success: false, error: errors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { userId, device_id } = validationResult.data;

    // Get IP address from various headers (proxy-aware)
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    
    let clientIp = cfConnectingIp || 
                   (forwardedFor ? forwardedFor.split(",")[0].trim() : null) || 
                   realIp || 
                   "unknown";

    const userAgent = req.headers.get("user-agent") || "unknown";

    console.log(`[register-freemium] Registering freemium for user ${userId} from IP: ${clientIp}, Device: ${device_id?.substring(0, 8)}...`);

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Double-check eligibility before creating subscription with device_id
    const { data: eligibilityData, error: eligibilityError } = await supabase
      .rpc("check_free_eligibility", { 
        p_ip_address: clientIp,
        p_device_id: device_id
      });

    if (eligibilityError) {
      console.error(`[register-freemium] Error checking eligibility:`, eligibilityError);
      throw new Error("Failed to verify eligibility");
    }

    const eligibility = eligibilityData?.[0];

    if (!eligibility?.allowed) {
      console.log(`[register-freemium] Not eligible: ${eligibility?.reason}`);
      
      // Log the blocked attempt with user_id and device_id
      await supabase.from("ip_fraud_logs").insert({
        ip_address: clientIp,
        device_id: device_id,
        user_id: userId,
        status: "blocked",
        reason: eligibility?.reason || "unknown",
        user_agent: userAgent,
      });

      // Generate user-friendly error message
      let errorMessage = "Erro ao processar cadastro.";
      switch (eligibility?.reason) {
        case "device_limit":
          errorMessage = "Este dispositivo já possui uma conta gratuita ativa.";
          break;
        case "ip_limit":
          errorMessage = "O limite de contas gratuitas por rede foi atingido.";
          break;
        case "rate_limit":
          errorMessage = "Muitas tentativas em pouco tempo. Tente novamente mais tarde.";
          break;
      }

      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Calculate end date (30 days from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    // Create freemium subscription with origin IP and device_id
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_type: "freemium",
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        origin_ip: clientIp,
        origin_device_id: device_id,
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error(`[register-freemium] Error creating subscription:`, subscriptionError);
      throw new Error("Failed to create subscription");
    }

    // Log successful registration
    await supabase.from("ip_fraud_logs").insert({
      ip_address: clientIp,
      device_id: device_id,
      user_id: userId,
      status: "allowed",
      reason: "freemium_created",
      user_agent: userAgent,
    });

    console.log(`[register-freemium] Successfully created freemium for user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          plan_type: subscription.plan_type,
          end_date: subscription.end_date,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error(`[register-freemium] Unexpected error:`, error);
    
    return new Response(
      JSON.stringify({ success: false, error: "Erro ao processar cadastro. Tente novamente." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});