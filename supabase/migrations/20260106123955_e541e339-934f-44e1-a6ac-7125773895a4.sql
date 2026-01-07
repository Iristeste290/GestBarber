-- Create table to track redirect analytics
CREATE TABLE public.redirect_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  redirect_type TEXT NOT NULL CHECK (redirect_type IN ('pwa_installed', 'frequent_visitor', 'landing_page')),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow anonymous inserts (public tracking)
ALTER TABLE public.redirect_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (anonymous tracking)
CREATE POLICY "Anyone can insert redirect analytics"
ON public.redirect_analytics
FOR INSERT
WITH CHECK (true);

-- Only authenticated users with admin role can view
CREATE POLICY "Admins can view redirect analytics"
ON public.redirect_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_redirect_analytics_type_created ON public.redirect_analytics(redirect_type, created_at DESC);