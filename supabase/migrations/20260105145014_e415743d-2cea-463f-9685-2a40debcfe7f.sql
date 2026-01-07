-- Drop the existing check constraint and add a new one that includes 'no_show'
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));