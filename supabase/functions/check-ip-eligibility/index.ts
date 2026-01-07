import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EligibilityResponse {
  allowed: boolean;
  reason: string;
  message: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get device_id from request body (optional)
    let deviceId: string | null = null;
    try {
      const body = await req.json();
      deviceId = body?.device_id || null;
    } catch {
      // No body or invalid JSON - device_id will be null
    }

    // Get IP address from various headers (proxy-aware)
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    
    // Priority: Cloudflare > X-Forwarded-For > X-Real-IP > fallback
    let clientIp = cfConnectingIp || 
                   (forwardedFor ? forwardedFor.split(",")[0].trim() : null) || 
                   realIp || 
                   "unknown";

    const userAgent = req.headers.get("user-agent") || "unknown";

    console.log(`[check-ip-eligibility] Checking IP: ${clientIp}, Device: ${deviceId?.substring(0, 8)}...`);

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the enhanced database function with device_id support
    const { data: eligibilityData, error: eligibilityError } = await supabase
      .rpc("check_free_eligibility", { 
        p_ip_address: clientIp,
        p_device_id: deviceId 
      });

    if (eligibilityError) {
      console.error(`[check-ip-eligibility] Error checking eligibility:`, eligibilityError);
      throw new Error("Failed to check IP eligibility");
    }

    const result = eligibilityData?.[0] || {
      allowed: true,
      reason: "eligible",
      active_freemium_count_ip: 0,
      active_freemium_count_device: 0,
      recent_attempts: 0,
    };

    console.log(`[check-ip-eligibility] Result for IP ${clientIp}:`, result);

    // Determine status for logging
    let logStatus: "allowed" | "blocked" | "warning" = "allowed";
    let logReason = result.reason;

    if (!result.allowed) {
      logStatus = "blocked";
    } else if (result.recent_attempts >= 2) {
      logStatus = "warning";
      logReason = "multiple_attempts";
    }

    // Log the attempt with device_id
    const { error: logError } = await supabase
      .from("ip_fraud_logs")
      .insert({
        ip_address: clientIp,
        device_id: deviceId,
        status: logStatus,
        reason: logReason,
        user_agent: userAgent,
      });

    if (logError) {
      console.error(`[check-ip-eligibility] Error logging attempt:`, logError);
      // Don't fail the request if logging fails
    }

    // Generate user-friendly message based on reason
    let message = "";
    if (!result.allowed) {
      switch (result.reason) {
        case "device_limit":
          message = "Este dispositivo já possui uma conta gratuita ativa. Utilize a conta existente ou assine um plano pago.";
          break;
        case "ip_limit":
          message = "O limite de contas gratuitas por rede foi atingido. Caso precise de acesso adicional, assine um plano pago.";
          break;
        case "rate_limit":
          message = "Muitas tentativas em pouco tempo. Tente novamente mais tarde.";
          break;
        default:
          message = "Não foi possível processar seu cadastro no momento. Tente novamente mais tarde.";
      }
    }

    const response: EligibilityResponse = {
      allowed: result.allowed,
      reason: result.reason,
      message,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(`[check-ip-eligibility] Unexpected error:`, error);
    
    // On error, allow the signup (fail-open to not block legitimate users)
    return new Response(
      JSON.stringify({
        allowed: true,
        reason: "error_fallback",
        message: "",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
