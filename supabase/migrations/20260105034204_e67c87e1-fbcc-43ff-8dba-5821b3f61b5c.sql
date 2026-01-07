
-- Allow admins to view all waitlist entries
CREATE POLICY "Admins can view all waitlist entries" 
ON public.feature_waitlist 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));
