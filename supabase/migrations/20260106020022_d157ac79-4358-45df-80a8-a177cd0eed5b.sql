-- Permitir admins visualizarem todos os feedbacks
CREATE POLICY "Admins can view all trial feedback" 
ON public.trial_feedback 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));