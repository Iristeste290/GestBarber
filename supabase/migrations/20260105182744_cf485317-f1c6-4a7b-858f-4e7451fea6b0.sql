-- Criar política que permite leitura pública de perfis (apenas para informações da barbearia)
CREATE POLICY "Public can view barbershop info" 
ON public.profiles 
FOR SELECT 
USING (true);