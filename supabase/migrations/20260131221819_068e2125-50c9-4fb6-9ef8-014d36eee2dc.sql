-- Function to anonymize and delete user data following LGPD guidelines
-- Keeps statistical data but removes all personally identifiable information

CREATE OR REPLACE FUNCTION public.delete_user_account_lgpd(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anonymized_name TEXT := 'Cliente Removido';
  v_anonymized_phone TEXT := '00000000000';
BEGIN
  -- Verify the user is deleting their own account
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Não autorizado: você só pode excluir sua própria conta';
  END IF;

  -- 1. Anonymize appointments (keep for statistics)
  UPDATE public.appointments
  SET 
    customer_name = v_anonymized_name,
    customer_phone = v_anonymized_phone,
    notes = NULL
  WHERE client_id = p_user_id;

  -- 2. Anonymize client_behavior records
  UPDATE public.client_behavior
  SET 
    client_name = v_anonymized_name,
    client_phone = v_anonymized_phone,
    city = NULL,
    neighborhood = NULL,
    postal_code = NULL,
    latitude = NULL,
    longitude = NULL
  WHERE client_id = p_user_id::TEXT OR user_id = p_user_id;

  -- 3. Delete chat messages
  DELETE FROM public.chat_messages WHERE user_id = p_user_id;

  -- 4. Delete automation logs
  DELETE FROM public.automation_logs WHERE user_id = p_user_id;

  -- 5. Delete loyalty data
  DELETE FROM public.loyalty_transactions WHERE user_id = p_user_id;
  DELETE FROM public.loyalty_points WHERE user_id = p_user_id;

  -- 6. Delete push subscriptions
  DELETE FROM public.push_subscriptions WHERE user_id = p_user_id;

  -- 7. Delete notification preferences
  DELETE FROM public.notification_preferences WHERE user_id = p_user_id;

  -- 8. Delete feature waitlist entries
  DELETE FROM public.feature_waitlist WHERE user_id = p_user_id;

  -- 9. Delete app update views
  DELETE FROM public.app_update_views WHERE user_id = p_user_id;

  -- 10. Delete feature announcement views
  DELETE FROM public.feature_announcement_views WHERE user_id = p_user_id;

  -- 11. Delete user roles
  DELETE FROM public.user_roles WHERE user_id = p_user_id;

  -- 12. Delete profile (this contains personal data)
  DELETE FROM public.profiles WHERE id = p_user_id;

  -- 13. Finally, delete the auth user (this will cascade and complete the deletion)
  -- Note: This requires service_role, so we'll handle it via edge function
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account_lgpd(UUID) TO authenticated;

-- Create a table to log account deletion requests for compliance
CREATE TABLE IF NOT EXISTS public.account_deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  status TEXT DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.account_deletion_logs ENABLE ROW LEVEL SECURITY;

-- Only the user can see their own deletion request
CREATE POLICY "Users can view own deletion logs"
ON public.account_deletion_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only the system can insert (via security definer function)
CREATE POLICY "System can insert deletion logs"
ON public.account_deletion_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);