-- Fix the security definer view issue by recreating it with SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.ip_fraud_stats;
CREATE VIEW public.ip_fraud_stats 
WITH (security_invoker = true)
AS
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