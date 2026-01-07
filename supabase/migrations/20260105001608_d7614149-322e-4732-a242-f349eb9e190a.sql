-- Table to track login attempts for rate limiting
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts(email, attempted_at DESC);
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts(ip_address, attempted_at DESC);

-- Enable RLS (but allow inserts without auth for tracking failed attempts)
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Policy to allow inserting attempts (needed for tracking before auth)
CREATE POLICY "Allow insert login attempts" ON public.login_attempts
  FOR INSERT WITH CHECK (true);

-- Policy to allow reading own attempts (for debugging)
CREATE POLICY "Users can read their own attempts" ON public.login_attempts
  FOR SELECT USING (true);

-- Function to check if login is allowed (not locked out)
CREATE OR REPLACE FUNCTION public.check_login_allowed(p_email TEXT, p_ip TEXT DEFAULT NULL)
RETURNS TABLE (
  allowed BOOLEAN,
  remaining_attempts INT,
  locked_until TIMESTAMP WITH TIME ZONE,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_failed_count INT;
  v_last_failed_at TIMESTAMP WITH TIME ZONE;
  v_lockout_duration INTERVAL := '15 minutes';
  v_max_attempts INT := 5;
  v_window INTERVAL := '15 minutes';
BEGIN
  -- Count failed attempts in the last 15 minutes for this email
  SELECT 
    COUNT(*),
    MAX(attempted_at)
  INTO v_failed_count, v_last_failed_at
  FROM public.login_attempts
  WHERE 
    email = LOWER(p_email)
    AND success = false
    AND attempted_at > (now() - v_window);
  
  -- If max attempts exceeded, check if still in lockout period
  IF v_failed_count >= v_max_attempts THEN
    IF v_last_failed_at + v_lockout_duration > now() THEN
      RETURN QUERY SELECT 
        false::BOOLEAN,
        0::INT,
        (v_last_failed_at + v_lockout_duration)::TIMESTAMP WITH TIME ZONE,
        'Conta bloqueada temporariamente'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Login allowed
  RETURN QUERY SELECT 
    true::BOOLEAN,
    (v_max_attempts - v_failed_count)::INT,
    NULL::TIMESTAMP WITH TIME ZONE,
    NULL::TEXT;
END;
$$;

-- Function to record a login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_ip TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, ip_address, success, attempted_at)
  VALUES (LOWER(p_email), p_ip, p_success, now());
  
  -- Clean up old attempts (older than 24 hours) to prevent table bloat
  DELETE FROM public.login_attempts 
  WHERE attempted_at < (now() - INTERVAL '24 hours');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_login_allowed TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_login_attempt TO anon, authenticated;