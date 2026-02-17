import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encryptToken, decryptToken } from '../_shared/token-encryption.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { action, code, redirectUri, userId } = await req.json();

    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!googleClientId || !googleClientSecret) {
      throw new Error(
        'Credenciais do Google não configuradas no backend (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET).'
      );
    }

    console.log('Google Business Auth action:', action);

    if (action === 'get-auth-url') {
      const scope = encodeURIComponent('https://www.googleapis.com/auth/business.manage');
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'exchange-code') {
      console.log('Exchanging code for tokens');

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (tokens.error) {
        console.error('Token exchange error:', tokens);
        throw new Error(tokens.error_description || tokens.error);
      }

      console.log('Tokens received, fetching accounts');

      const accountsResponse = await fetch(
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }
      );

      const accountsData = await accountsResponse.json();
      console.log('Accounts data:', JSON.stringify(accountsData));

      if (accountsData.error) {
        console.error('Google Business API error:', accountsData.error);
        return new Response(JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          accounts: [],
          error: accountsData.error,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const accounts = accountsData.accounts || [];
      const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      return new Response(JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokenExpiresAt,
        accounts,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get-locations') {
      const { accessToken, accountId } = await req.json();
      
      console.log('Fetching locations for account:', accountId);

      const locationsResponse = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations?readMask=name,title,storefrontAddress`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const locationsData = await locationsResponse.json();
      console.log('Locations data:', JSON.stringify(locationsData));

      return new Response(JSON.stringify({
        locations: locationsData.locations || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'save-connection') {
      const { accessToken, refreshToken, tokenExpiresAt, accountId, accountName, locationId, locationName } = await req.json();

      console.log('Saving connection for user:', userId);

      // Encrypt tokens before storing
      const encryptedAccessToken = await encryptToken(accessToken);
      const encryptedRefreshToken = refreshToken ? await encryptToken(refreshToken) : null;

      const { error } = await supabase
        .from('google_business_connection')
        .upsert({
          user_id: userId,
          business_id: locationId,
          account_name: accountName,
          location_name: locationName,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: tokenExpiresAt,
          is_connected: true,
          last_sync_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Error saving connection:', error);
        throw error;
      }

      console.log('Connection saved successfully');

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'disconnect') {
      console.log('Disconnecting user:', userId);

      const { error } = await supabase
        .from('google_business_connection')
        .update({
          is_connected: false,
          access_token: null,
          refresh_token: null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    console.error('Google Business Auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
