-- Fix remaining overly permissive RLS policies

-- 1. automation_logs - only user's own logs
DROP POLICY IF EXISTS "Sistema pode criar logs de automação" ON public.automation_logs;
CREATE POLICY "Users can insert their own automation logs" ON public.automation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. chat_messages - only user's own messages  
DROP POLICY IF EXISTS "System can insert messages" ON public.chat_messages;
CREATE POLICY "Users can insert their own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. notifications - only user's own notifications
DROP POLICY IF EXISTS "Sistema pode criar notificações" ON public.notifications;
CREATE POLICY "Users receive their own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. ip_fraud_logs - system managed, admin viewable
DROP POLICY IF EXISTS "System can manage fraud logs" ON public.ip_fraud_logs;
-- For system inserts (from edge functions), we need to allow anon/service role
CREATE POLICY "System can insert fraud logs" ON public.ip_fraud_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view fraud logs" ON public.ip_fraud_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage fraud logs" ON public.ip_fraud_logs
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. subscriptions - restrict to user's own + service role
DROP POLICY IF EXISTS "Service can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Service role (edge functions/webhooks) can manage all subscriptions
CREATE POLICY "Service role manages subscriptions" ON public.subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- The following policies are INTENTIONALLY public for analytics/leads collection:
-- - barbershop_leads: Public landing page lead capture
-- - feature_waitlist: Anyone can join waitlist  
-- - help_article_feedback: Anonymous feedback allowed
-- - pwa_analytics: Anonymous PWA tracking
-- - redirect_analytics: Anonymous redirect tracking
-- - login_attempts: System logging

-- Add rate limiting comment for documentation
COMMENT ON TABLE public.barbershop_leads IS 'Public lead capture - rate limited at application level';
COMMENT ON TABLE public.feature_waitlist IS 'Public waitlist - rate limited at application level';
COMMENT ON TABLE public.help_article_feedback IS 'Anonymous feedback allowed';
COMMENT ON TABLE public.pwa_analytics IS 'Anonymous PWA analytics tracking';
COMMENT ON TABLE public.redirect_analytics IS 'Anonymous redirect analytics';
COMMENT ON TABLE public.login_attempts IS 'Login attempt logging for security';