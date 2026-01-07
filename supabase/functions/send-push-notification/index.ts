import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, title, body, data } = (await req.json()) as PushPayload;

    console.log(`Sending push notification to user: ${userId}`);
    console.log(`Title: ${title}, Body: ${body}`);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("id, subscription")
      .eq("user_id", userId);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for user");
      return new Response(
        JSON.stringify({ success: false, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${subscriptions.length} subscription(s)`);

    // Create the push payload
    const pushPayload = JSON.stringify({
      title,
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: data || {},
    });

    // Send to all subscriptions
    let successCount = 0;
    let failCount = 0;

    for (const sub of subscriptions) {
      try {
        const subscription = sub.subscription as { endpoint: string; keys?: { p256dh: string; auth: string } };
        const endpoint = subscription.endpoint;

        if (!endpoint) {
          console.error("Invalid subscription - no endpoint");
          failCount++;
          continue;
        }

        // Send using simple POST (browser push services accept this)
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "TTL": "86400",
          },
          body: pushPayload,
        });

        if (response.ok || response.status === 201) {
          successCount++;
          console.log("Push sent successfully");
        } else {
          console.error(`Push failed with status ${response.status}`);
          failCount++;
          
          // Remove expired/invalid subscriptions (status 404 or 410)
          if (response.status === 404 || response.status === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", sub.id);
            console.log("Removed invalid subscription");
          }
        }
      } catch (pushError) {
        console.error("Error sending push:", pushError);
        failCount++;
      }
    }

    console.log(`Push results: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        sent: successCount,
        failed: failCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-push-notification:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
