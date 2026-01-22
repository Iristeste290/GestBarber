-- Create table to track upgrade trigger events
CREATE TABLE public.upgrade_trigger_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_message TEXT,
  lost_money NUMERIC,
  lost_clients INTEGER,
  abandoned_bookings INTEGER,
  manual_time_minutes INTEGER,
  no_show_count INTEGER,
  potential_revenue NUMERIC,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.upgrade_trigger_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view all events
CREATE POLICY "Admins can view all trigger events"
ON public.upgrade_trigger_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Users can insert their own events
CREATE POLICY "Users can insert their own trigger events"
ON public.upgrade_trigger_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own events (for conversion tracking)
CREATE POLICY "Users can update their own trigger events"
ON public.upgrade_trigger_events
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_trigger_events_user_id ON public.upgrade_trigger_events(user_id);
CREATE INDEX idx_trigger_events_trigger_type ON public.upgrade_trigger_events(trigger_type);
CREATE INDEX idx_trigger_events_created_at ON public.upgrade_trigger_events(created_at DESC);