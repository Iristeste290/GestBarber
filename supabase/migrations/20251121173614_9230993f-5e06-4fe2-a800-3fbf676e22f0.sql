-- Corrigir política RLS para barber_work_hours
-- Permitir que usuários gerenciem horários de seus barbeiros OU barbeiros sem dono
DROP POLICY IF EXISTS "Barbeiros podem gerenciar seus intervalos" ON barber_work_hours;

CREATE POLICY "Usuários podem gerenciar horários de seus barbeiros"
ON barber_work_hours
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM barbers
    WHERE barbers.id = barber_work_hours.barber_id
    AND (barbers.user_id = auth.uid() OR barbers.user_id IS NULL)
  )
);

-- Mesma correção para barber_breaks
DROP POLICY IF EXISTS "Barbeiros podem gerenciar seus intervalos" ON barber_breaks;

CREATE POLICY "Usuários podem gerenciar intervalos de seus barbeiros"
ON barber_breaks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM barbers
    WHERE barbers.id = barber_breaks.barber_id
    AND (barbers.user_id = auth.uid() OR barbers.user_id IS NULL)
  )
);