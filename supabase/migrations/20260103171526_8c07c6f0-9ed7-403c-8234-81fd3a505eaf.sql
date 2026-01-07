-- Add activation fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS activation_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS activation_source TEXT;

-- Create index for faster activation checks
CREATE INDEX IF NOT EXISTS idx_profiles_activation ON public.profiles(activation_completed) WHERE activation_completed = false;