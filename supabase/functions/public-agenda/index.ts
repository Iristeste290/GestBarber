import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength > 5_000) {
      return new Response(JSON.stringify({ error: "Payload muito grande" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const userId = String(body?.userId ?? "").trim();

    if (!UUID_REGEX.test(userId)) {
      return new Response(JSON.stringify({ error: "userId inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("barbershop_name, barbershop_logo_url")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;

    const { data: barbers, error: barbersError } = await supabase
      .from("barbers")
      .select("id, name, specialty, avatar_url, slug")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("name");

    if (barbersError) throw barbersError;

    return new Response(
      JSON.stringify({
        barbershop: {
          barbershop_name: profile?.barbershop_name ?? null,
          barbershop_logo_url: profile?.barbershop_logo_url ?? null,
        },
        barbers: barbers ?? [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[public-agenda] Error:", error);
    return new Response(JSON.stringify({ error: "Erro ao carregar agenda pública" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
