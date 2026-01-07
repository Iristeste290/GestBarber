-- Add device_id column to ip_fraud_logs table
ALTER TABLE public.ip_fraud_logs 
ADD COLUMN IF NOT EXISTS device_id text;

-- Add device_id column to subscriptions table for tracking
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS origin_device_id text;

-- Create index for faster device_id lookups
CREATE INDEX IF NOT EXISTS idx_ip_fraud_logs_device_id ON public.ip_fraud_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_origin_device_id ON public.subscriptions(origin_device_id);

-- Drop and recreate the eligibility check function with device support
DROP FUNCTION IF EXISTS public.check_ip_freemium_eligibility(text);

-- Create enhanced eligibility check function with device_id support
CREATE OR REPLACE FUNCTION public.check_free_eligibility(
  p_ip_address text,
  p_device_id text DEFAULT NULL
)
RETURNS TABLE(
  allowed boolean,
  reason text,
  active_freemium_count_ip integer,
  active_freemium_count_device integer,
  recent_attempts integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_thirty_days_ago timestamp with time zone;
  v_twenty_four_hours_ago timestamp with time zone;
  v_active_freemium_count_ip integer;
  v_active_freemium_count_device integer;
  v_recent_attempts integer;
BEGIN
  v_thirty_days_ago := now() - interval '30 days';
  v_twenty_four_hours_ago := now() - interval '24 hours';
  
  -- Count active freemium subscriptions from this IP (only freemium, not paid)
  SELECT COUNT(*)::integer INTO v_active_freemium_count_ip
  FROM subscriptions s
  WHERE s.origin_ip = p_ip_address
    AND s.plan_type = 'freemium'
    AND s.status = 'active'
    AND s.created_at > v_thirty_days_ago;
  
  -- Count active freemium subscriptions from this device (only if device_id provided)
  IF p_device_id IS NOT NULL AND p_device_id != '' THEN
    SELECT COUNT(*)::integer INTO v_active_freemium_count_device
    FROM subscriptions s
    WHERE s.origin_device_id = p_device_id
      AND s.plan_type = 'freemium'
      AND s.status = 'active'
      AND s.created_at > v_thirty_days_ago;
  ELSE
    v_active_freemium_count_device := 0;
  END IF;
  
  -- Count recent attempts from this IP (only FREE attempts - not paid registrations)
  SELECT COUNT(*)::integer INTO v_recent_attempts
  FROM ip_fraud_logs ifl
  WHERE ifl.ip_address = p_ip_address
    AND ifl.attempt_date > v_twenty_four_hours_ago;
  
  -- Check device limit first (1 free account per device)
  IF v_active_freemium_count_device >= 1 THEN
    RETURN QUERY SELECT 
      false::boolean,
      'device_limit'::text,
      v_active_freemium_count_ip,
      v_active_freemium_count_device,
      v_recent_attempts;
    RETURN;
  END IF;
  
  -- Check IP limit (2 free accounts per IP)
  IF v_active_freemium_count_ip >= 2 THEN
    RETURN QUERY SELECT 
      false::boolean,
      'ip_limit'::text,
      v_active_freemium_count_ip,
      v_active_freemium_count_device,
      v_recent_attempts;
    RETURN;
  END IF;
  
  -- Check rate limit (4 attempts per 24h)
  IF v_recent_attempts >= 4 THEN
    RETURN QUERY SELECT 
      false::boolean,
      'rate_limit'::text,
      v_active_freemium_count_ip,
      v_active_freemium_count_device,
      v_recent_attempts;
    RETURN;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT 
    true::boolean,
    'eligible'::text,
    v_active_freemium_count_ip,
    v_active_freemium_count_device,
    v_recent_attempts;
END;
$$;

-- Update the ip_fraud_stats view to include device info
DROP VIEW IF EXISTS public.ip_fraud_stats;
CREATE VIEW public.ip_fraud_stats AS
SELECT 
  ip_address,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE status = 'allowed') as successful_registrations,
  COUNT(*) FILTER (WHERE status = 'blocked') as blocked_attempts,
  COUNT(*) FILTER (WHERE status = 'warning') as warnings,
  MIN(attempt_date) as first_attempt,
  MAX(attempt_date) as last_attempt,
  COUNT(DISTINCT device_id) as unique_devices
FROM ip_fraud_logs
GROUP BY ip_address;