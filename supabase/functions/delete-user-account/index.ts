import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the user making the request
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the userId from request body
    const { userId } = await req.json();

    // Verify user is deleting their own account
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: "Você só pode excluir sua própria conta" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the deletion request for compliance
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get IP address for logging
    const ipAddress = req.headers.get("x-forwarded-for") || 
                      req.headers.get("x-real-ip") || 
                      "unknown";

    // Insert deletion log
    await adminClient.from("account_deletion_logs").insert({
      user_id: userId,
      ip_address: ipAddress,
      status: "processing",
    });

    // Delete the auth user using service role
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      
      // Update log with error
      await adminClient
        .from("account_deletion_logs")
        .update({ status: "failed" })
        .eq("user_id", userId)
        .order("requested_at", { ascending: false })
        .limit(1);

      return new Response(
        JSON.stringify({ error: "Erro ao excluir conta: " + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update log with success
    await adminClient
      .from("account_deletion_logs")
      .update({ 
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .order("requested_at", { ascending: false })
      .limit(1);

    console.log(`User account deleted successfully: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Conta excluída com sucesso conforme LGPD" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Delete account error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar solicitação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
