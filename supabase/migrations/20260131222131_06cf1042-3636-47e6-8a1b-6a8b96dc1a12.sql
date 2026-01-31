-- Create audit logs table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);

-- Enable RLS - only admins can view audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- System can insert via security definer functions
CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to log audit events (callable from frontend for exports)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    metadata
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.log_audit_event(TEXT, TEXT, UUID, JSONB) TO authenticated;

-- Generic audit trigger function for financial tables
CREATE OR REPLACE FUNCTION public.audit_financial_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_old_data JSONB;
  v_new_data JSONB;
  v_user_id UUID;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
    v_user_id := COALESCE(auth.uid(), NEW.user_id);
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_user_id := COALESCE(auth.uid(), NEW.user_id);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    v_user_id := COALESCE(auth.uid(), OLD.user_id);
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    v_user_id,
    v_action,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    v_old_data,
    v_new_data
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for financial tables

-- Payments table
DROP TRIGGER IF EXISTS audit_payments_trigger ON public.payments;
CREATE TRIGGER audit_payments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_financial_changes();

-- Expenses table
DROP TRIGGER IF EXISTS audit_expenses_trigger ON public.expenses;
CREATE TRIGGER audit_expenses_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.audit_financial_changes();

-- Cash transactions table
DROP TRIGGER IF EXISTS audit_cash_transactions_trigger ON public.cash_transactions;
CREATE TRIGGER audit_cash_transactions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.cash_transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_financial_changes();

-- Cash register sessions table
DROP TRIGGER IF EXISTS audit_cash_sessions_trigger ON public.cash_register_sessions;
CREATE TRIGGER audit_cash_sessions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.cash_register_sessions
  FOR EACH ROW EXECUTE FUNCTION public.audit_financial_changes();

-- Subscriptions table
DROP TRIGGER IF EXISTS audit_subscriptions_trigger ON public.subscriptions;
CREATE TRIGGER audit_subscriptions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.audit_financial_changes();

-- Product sales table
DROP TRIGGER IF EXISTS audit_product_sales_trigger ON public.product_sales;
CREATE TRIGGER audit_product_sales_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.product_sales
  FOR EACH ROW EXECUTE FUNCTION public.audit_financial_changes();