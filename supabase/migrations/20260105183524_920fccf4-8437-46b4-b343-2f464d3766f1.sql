-- Permitir leitura pública de serviços ativos
CREATE POLICY "Public can view active services" 
ON public.services 
FOR SELECT 
USING (is_active = true);

-- Permitir leitura pública de barbeiros ativos
CREATE POLICY "Public can view active barbers" 
ON public.barbers 
FOR SELECT 
USING (is_active = true);

-- Permitir leitura pública de horários de trabalho
CREATE POLICY "Public can view barber work hours" 
ON public.barber_work_hours 
FOR SELECT 
USING (true);

-- Permitir leitura pública de intervalos (breaks)
CREATE POLICY "Public can view barber breaks" 
ON public.barber_breaks 
FOR SELECT 
USING (true);

-- Permitir leitura pública de exceções (folgas/feriados)
CREATE POLICY "Public can view barber exceptions" 
ON public.barber_exceptions 
FOR SELECT 
USING (true);