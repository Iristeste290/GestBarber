-- Fix security definer view by using SECURITY INVOKER (default)
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
  MAX(attempt_date) as last_attempt
FROM public.ip_fraud_logs
WHERE attempt_date > NOW() - INTERVAL '30 days'
GROUP BY ip_address;