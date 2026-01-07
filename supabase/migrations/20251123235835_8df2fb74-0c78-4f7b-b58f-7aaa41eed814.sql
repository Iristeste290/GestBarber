-- Remove legacy role column from profiles table
-- This column is deprecated and roles should ONLY be managed via user_roles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;