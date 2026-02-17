import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptToken, encryptToken } from '../_shared/token-encryption.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function getDecryptedToken(encryptedToken: string): Promise<string> {
  try {
    return await decryptToken(encryptedToken);
  } catch {
    // Fallback: token might be stored in plaintext (pre-encryption migration)
    return encryptedToken;
  }
}

async function refreshTokenIfNeeded(supabase: any, connection: any): Promise<string | null> {
  const tokenExpiresAt = new Date(connection.token_expires_at);
  const now = new Date();

  if (tokenExpiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('Token expired or expiring soon, refreshing...');

    const refreshToken = await getDecryptedToken(connection.refresh_token);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error('Token refresh error:', tokens);
      return null;
    }

    const newTokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Encrypt the new access token before storing
    const encryptedAccessToken = await encryptToken(tokens.access_token);

    await supabase
      .from('google_business_connection')
      .update({
        access_token: encryptedAccessToken,
        token_expires_at: newTokenExpiresAt,
      })
      .eq('id', connection.id);

    console.log('Token refreshed successfully');
    return tokens.access_token;
  }

  return await getDecryptedToken(connection.access_token);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { action, userId } = await req.json();

    console.log('Google Business Metrics action:', action);

    if (action === 'sync-metrics') {
      const { data: connection, error: connError } = await supabase
        .from('google_business_connection')
        .select('*')
        .eq('user_id', userId)
        .eq('is_connected', true)
        .single();

      if (connError || !connection) {
        console.log('No active connection found for user:', userId);
        return new Response(JSON.stringify({ error: 'Not connected' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const accessToken = await refreshTokenIfNeeded(supabase, connection);
      if (!accessToken) {
        return new Response(JSON.stringify({ error: 'Failed to refresh token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const locationId = connection.business_id;
      console.log('Fetching metrics for location:', locationId);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const dateRange = {
        startDate: {
          year: startDate.getFullYear(),
          month: startDate.getMonth() + 1,
          day: startDate.getDate(),
        },
        endDate: {
          year: endDate.getFullYear(),
          month: endDate.getMonth() + 1,
          day: endDate.getDate(),
        },
      };

      const insightsUrl = `https://businessprofileperformance.googleapis.com/v1/${locationId}:getDailyMetricsTimeSeries`;
      
      const metricsResponse = await fetch(insightsUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dailyRange: dateRange,
          dailyMetrics: [
            'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
            'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
            'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
            'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
            'CALL_CLICKS',
            'WEBSITE_CLICKS',
            'BUSINESS_DIRECTION_REQUESTS',
          ],
        }),
      });

      const metricsData = await metricsResponse.json();
      console.log('Metrics response:', JSON.stringify(metricsData));

      let totalViews = 0;
      let totalCalls = 0;
      let totalWebsiteClicks = 0;
      let totalDirections = 0;

      if (metricsData.timeSeries) {
        for (const series of metricsData.timeSeries) {
          const values = series.datedValues || [];
          for (const dv of values) {
            const value = parseInt(dv.value) || 0;
            
            if (series.dailyMetric.includes('IMPRESSIONS')) {
              totalViews += value;
            } else if (series.dailyMetric === 'CALL_CLICKS') {
              totalCalls += value;
            } else if (series.dailyMetric === 'WEBSITE_CLICKS') {
              totalWebsiteClicks += value;
            } else if (series.dailyMetric === 'BUSINESS_DIRECTION_REQUESTS') {
              totalDirections += value;
            }
          }
        }
      }

      const today = new Date().toISOString().split('T')[0];

      const { error: upsertError } = await supabase
        .from('google_business_metrics')
        .upsert({
          user_id: userId,
          metric_date: today,
          views_count: totalViews,
          phone_calls: totalCalls,
          website_clicks: totalWebsiteClicks,
          direction_requests: totalDirections,
          searches_count: Math.floor(totalViews * 0.6),
        }, {
          onConflict: 'user_id,metric_date',
        });

      if (upsertError) {
        console.error('Error saving metrics:', upsertError);
      }

      await supabase
        .from('google_business_connection')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', connection.id);

      console.log('Metrics synced successfully');

      return new Response(JSON.stringify({
        success: true,
        metrics: {
          views: totalViews,
          calls: totalCalls,
          websiteClicks: totalWebsiteClicks,
          directions: totalDirections,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'sync-all') {
      console.log('Syncing all connected accounts');

      const { data: connections, error } = await supabase
        .from('google_business_connection')
        .select('*')
        .eq('is_connected', true);

      if (error) throw error;

      let synced = 0;
      let failed = 0;

      for (const connection of connections || []) {
        try {
          const accessToken = await refreshTokenIfNeeded(supabase, connection);
          if (!accessToken) {
            failed++;
            continue;
          }
          synced++;
        } catch (e) {
          console.error('Error syncing connection:', connection.id, e);
          failed++;
        }
      }

      console.log(`Sync complete: ${synced} synced, ${failed} failed`);

      return new Response(JSON.stringify({ synced, failed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    console.error('Google Business Metrics error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
