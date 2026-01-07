-- Criar tabela de auditoria para mudanças de roles (segurança admin)
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL, -- 'role_added', 'role_removed', 'admin_access'
  performed_by UUID NOT NULL,
  target_user_id UUID,
  target_role TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only the system (via service role) can insert audit logs
-- Regular users cannot insert directly
CREATE POLICY "System can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- No one can update or delete audit logs (immutable)
-- No UPDATE or DELETE policies = no one can modify

-- Create function to prevent removing the last admin
CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Only check when removing admin role
  IF OLD.role = 'admin' THEN
    SELECT COUNT(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin' AND id != OLD.id;
    
    IF admin_count < 1 THEN
      RAISE EXCEPTION 'Não é possível remover o último administrador do sistema';
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create trigger to prevent last admin removal
CREATE TRIGGER prevent_last_admin_removal_trigger
BEFORE DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_last_admin_removal();

-- Also prevent updating the last admin to non-admin
CREATE OR REPLACE FUNCTION public.prevent_last_admin_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Only check when changing from admin to something else
  IF OLD.role = 'admin' AND NEW.role != 'admin' THEN
    SELECT COUNT(*) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin' AND id != OLD.id;
    
    IF admin_count < 1 THEN
      RAISE EXCEPTION 'Não é possível remover o último administrador do sistema';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_last_admin_update_trigger
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_last_admin_update();