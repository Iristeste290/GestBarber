-- Fix: Remove overly permissive INSERT policy on chat_messages
-- The "Users can create own chat messages" policy (auth.uid() = user_id) is sufficient
-- since both user and assistant messages are inserted client-side with the correct user_id
DROP POLICY IF EXISTS "System can insert messages" ON public.chat_messages;