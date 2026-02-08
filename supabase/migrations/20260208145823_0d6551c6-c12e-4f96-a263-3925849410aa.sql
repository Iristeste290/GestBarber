-- Add SELECT policy to support_tickets to allow users to view their own tickets
CREATE POLICY "Users can view their own tickets" 
ON public.support_tickets 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Deny anonymous select on support_tickets
CREATE POLICY "Deny anonymous select on support_tickets" 
ON public.support_tickets 
FOR SELECT 
TO anon
USING (false);