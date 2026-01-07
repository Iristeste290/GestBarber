-- Create table for PWA analytics events
CREATE TABLE public.pwa_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('prompt_shown', 'install_clicked', 'install_success', 'dismissed')),
  platform TEXT,
  user_agent TEXT,
  device_id TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pwa_analytics ENABLE ROW LEVEL SECURITY;

-- Allow insert from anyone (anonymous users can trigger PWA events)
CREATE POLICY "Anyone can insert PWA analytics" 
ON public.pwa_analytics 
FOR INSERT 
WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins can view PWA analytics" 
ON public.pwa_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_pwa_analytics_event_type ON public.pwa_analytics(event_type);
CREATE INDEX idx_pwa_analytics_created_at ON public.pwa_analytics(created_at DESC);