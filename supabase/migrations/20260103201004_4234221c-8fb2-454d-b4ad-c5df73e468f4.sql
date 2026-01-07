-- Create table for feature waitlist
CREATE TABLE public.feature_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(email, feature_name)
);

-- Enable RLS
ALTER TABLE public.feature_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own waitlist entries
CREATE POLICY "Users can add themselves to waitlist"
ON public.feature_waitlist
FOR INSERT
WITH CHECK (true);

-- Allow users to see their own entries
CREATE POLICY "Users can view their own waitlist entries"
ON public.feature_waitlist
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_feature_waitlist_feature ON public.feature_waitlist(feature_name);
CREATE INDEX idx_feature_waitlist_email ON public.feature_waitlist(email);