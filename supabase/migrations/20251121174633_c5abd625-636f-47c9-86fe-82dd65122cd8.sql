-- Drop existing delete policies that may be too restrictive
DROP POLICY IF EXISTS "Users can delete own barbers" ON public.barbers;
DROP POLICY IF EXISTS "Usuários podem gerenciar seus barbeiros" ON public.barbers;

-- Create updated policies that allow deleting own barbers AND barbers without user_id
CREATE POLICY "Users can delete own barbers or barbers without user_id"
ON public.barbers
FOR DELETE
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Usuários podem gerenciar seus barbeiros"
ON public.barbers
FOR ALL
USING (user_id = auth.uid() OR user_id IS NULL);