-- Add barbershop_name column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN barbershop_name TEXT NOT NULL DEFAULT '';