-- Create leads table for barbershop websites
CREATE TABLE public.barbershop_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  site_id UUID REFERENCES public.barber_sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.barbershop_leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert leads (public form)
CREATE POLICY "Anyone can submit leads" 
ON public.barbershop_leads 
FOR INSERT 
WITH CHECK (true);

-- Allow site owner to view their leads
CREATE POLICY "Users can view their own leads" 
ON public.barbershop_leads 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow site owner to update their leads
CREATE POLICY "Users can update their own leads" 
ON public.barbershop_leads 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_barbershop_leads_user_id ON public.barbershop_leads(user_id);
CREATE INDEX idx_barbershop_leads_site_id ON public.barbershop_leads(site_id);
CREATE INDEX idx_barbershop_leads_status ON public.barbershop_leads(status);