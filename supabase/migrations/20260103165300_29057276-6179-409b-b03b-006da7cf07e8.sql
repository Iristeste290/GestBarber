-- Create table to track IP-based registration attempts and fraud detection
CREATE TABLE public.ip_fraud_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attempt_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'allowed' CHECK (status IN ('allowed', 'blocked', 'warning')),
  reason TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast IP lookups
CREATE INDEX idx_ip_fraud_logs_ip_address ON public.ip_fraud_logs(ip_address);
CREATE INDEX idx_ip_fraud_logs_attempt_date ON public.ip_fraud_logs(attempt_date);
CREATE INDEX idx_ip_fraud_logs_status ON public.ip_fraud_logs(status);

-- Enable RLS
ALTER TABLE public.ip_fraud_logs ENABLE ROW LEVEL SECURITY;

-- Only allow system (service role) to manage fraud logs
CREATE POLICY "System can manage fraud logs"
ON public.ip_fraud_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Create a view to track IP statistics (for admin dashboard later)
CREATE OR REPLACE VIEW public.ip_fraud_stats AS
SELECT 
  ip_address,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE status = 'allowed') as successful_registrations,
  COUNT(*) FILTER (WHERE status = 'blocked') as blocked_attempts,
  COUNT(*) FILTER (WHERE status = 'warning') as warnings,
  MIN(attempt_date) as first_attempt,
  MAX(attempt_date) as last_attempt
FROM public.ip_fraud_logs
WHERE attempt_date > NOW() - INTERVAL '30 days'
GROUP BY ip_address;

-- Add ip_address column to subscriptions to track origin
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS origin_ip TEXT;

-- Create function to check IP eligibility
CREATE OR REPLACE FUNCTION public.check_ip_freemium_eligibility(p_ip_address TEXT)
RETURNS TABLE (
  allowed BOOLEAN,
  reason TEXT,
  active_freemium_count INTEGER,
  recent_attempts INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active_count INTEGER;
  v_recent_attempts INTEGER;
  v_max_freemium_per_ip INTEGER := 1;
  v_max_attempts_before_block INTEGER := 4;
BEGIN
  -- Count active freemium subscriptions from this IP in the last 30 days
  SELECT COUNT(*) INTO v_active_count
  FROM public.subscriptions
  WHERE origin_ip = p_ip_address
    AND plan_type = 'freemium'
    AND status = 'active'
    AND created_at > NOW() - INTERVAL '30 days';

  -- Count recent attempts from this IP (last 24 hours)
  SELECT COUNT(*) INTO v_recent_attempts
  FROM public.ip_fraud_logs
  WHERE ip_address = p_ip_address
    AND attempt_date > NOW() - INTERVAL '24 hours';

  -- Check if blocked due to too many attempts
  IF v_recent_attempts >= v_max_attempts_before_block THEN
    RETURN QUERY SELECT 
      false, 
      'rate_limit_exceeded'::TEXT, 
      v_active_count, 
      v_recent_attempts;
    RETURN;
  END IF;

  -- Check if IP already has active freemium
  IF v_active_count >= v_max_freemium_per_ip THEN
    RETURN QUERY SELECT 
      false, 
      'limit_reached'::TEXT, 
      v_active_count, 
      v_recent_attempts;
    RETURN;
  END IF;

  -- Allowed
  RETURN QUERY SELECT 
    true, 
    'eligible'::TEXT, 
    v_active_count, 
    v_recent_attempts;
END;
$$;