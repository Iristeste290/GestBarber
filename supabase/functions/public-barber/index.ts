import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidSlug(input: string) {
  // conservative: letters, numbers, hyphen
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(input) && input.length <= 80;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentLength = Number(req.headers.get("content-length") ?? "0");
    if (contentLength > 10_000) {
      return new Response(JSON.stringify({ error: "Payload muito grande" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const barberIdRaw = body?.barberId;
    const slugRaw = body?.slug;

    const barberId = barberIdRaw ? String(barberIdRaw).trim() : "";
    const slug = slugRaw ? String(slugRaw).trim() : "";

    if (!barberId && !slug) {
      return new Response(JSON.stringify({ error: "Informe barberId ou slug" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (barberId && !UUID_REGEX.test(barberId)) {
      return new Response(JSON.stringify({ error: "barberId inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (slug && !isValidSlug(slug)) {
      return new Response(JSON.stringify({ error: "slug inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const barberQuery = supabase
      .from("barbers")
      .select("id, name, specialty, avatar_url, slug, user_id, is_active")
      .eq("is_active", true);

    const { data: barber, error: barberError } = barberId
      ? await barberQuery.eq("id", barberId).maybeSingle()
      : await barberQuery.eq("slug", slug).maybeSingle();

    if (barberError) throw barberError;

    if (!barber) {
      return new Response(JSON.stringify({ error: "Barbeiro não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = barber.user_id as string;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("barbershop_name, barbershop_logo_url")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;

    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, name, duration_minutes, price")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("name");

    if (servicesError) throw servicesError;

    return new Response(
      JSON.stringify({
        barbershop: {
          barbershop_name: profile?.barbershop_name ?? null,
          barbershop_logo_url: profile?.barbershop_logo_url ?? null,
        },
        barber: {
          id: barber.id,
          name: barber.name,
          specialty: barber.specialty,
          avatar_url: barber.avatar_url,
          slug: barber.slug,
        },
        services: services ?? [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[public-barber] Error:", error);
    return new Response(JSON.stringify({ error: "Erro ao carregar dados do barbeiro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
