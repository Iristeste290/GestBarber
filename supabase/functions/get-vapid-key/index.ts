import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawVapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");

    if (!rawVapidPublicKey) {
      throw new Error("VAPID public key not configured");
    }

    // Some environments store the key with surrounding quotes. Normalize it here.
    const vapidPublicKey = rawVapidPublicKey.trim().replace(/^"+|"+$/g, "");

    if (vapidPublicKey.length < 20) {
      throw new Error("VAPID public key is invalid");
    }

    console.log("Returning VAPID public key");

    return new Response(
      JSON.stringify({ vapidPublicKey }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-vapid-key:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
