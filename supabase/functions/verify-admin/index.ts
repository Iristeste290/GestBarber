import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 requests per minute per IP

// In-memory rate limiter (works per instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  // Clean up old entries
  if (record && now > record.resetTime) {
    rateLimitMap.delete(ip);
  }
  
  const currentRecord = rateLimitMap.get(ip);
  
  if (!currentRecord) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (currentRecord.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetIn = currentRecord.resetTime - now;
    return { allowed: false, remaining: 0, resetIn };
  }
  
  currentRecord.count++;
  rateLimitMap.set(ip, currentRecord);
  
  return { 
    allowed: true, 
    remaining: MAX_REQUESTS_PER_WINDOW - currentRecord.count,
    resetIn: currentRecord.resetTime - now 
  };
}

function getClientIP(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;
  
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) return cfConnectingIP;
  
  return 'unknown';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';
  console.log('Verify-admin request from IP:', clientIP);

  // Check rate limit
  const rateLimit = checkRateLimit(clientIP);
  
  const rateLimitHeaders = {
    ...corsHeaders,
    'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
  };

  if (!rateLimit.allowed) {
    console.warn('Rate limit exceeded for IP:', clientIP);
    return new Response(
      JSON.stringify({ 
        isAdmin: false, 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000)
      }),
      { 
        status: 429, 
        headers: { 
          ...rateLimitHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString()
        } 
      }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'No authorization header' }),
        { status: 401, headers: { ...rateLimitHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('Invalid or expired session:', userError?.message);
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'Invalid session' }),
        { status: 401, headers: { ...rateLimitHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying admin status for user:', user.id);

    const supabaseServiceRole = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: roleData, error: roleError } = await supabaseServiceRole
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error('Error checking admin role:', roleError);
      return new Response(
        JSON.stringify({ isAdmin: false, error: 'Database error' }),
        { status: 500, headers: { ...rateLimitHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAdmin = !!roleData;
    
    // Log admin access attempt (audit trail)
    await supabaseServiceRole
      .from('admin_audit_logs')
      .insert({
        action: 'admin_access',
        performed_by: user.id,
        ip_address: clientIP,
        user_agent: userAgent,
        details: { 
          success: isAdmin,
          email: user.email,
          timestamp: new Date().toISOString()
        }
      });

    console.log('Admin verification result:', { userId: user.id, isAdmin, ip: clientIP });

    return new Response(
      JSON.stringify({ isAdmin, userId: user.id, email: user.email }),
      { headers: { ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in verify-admin:', error);
    return new Response(
      JSON.stringify({ isAdmin: false, error: 'Internal server error' }),
      { status: 500, headers: { ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
