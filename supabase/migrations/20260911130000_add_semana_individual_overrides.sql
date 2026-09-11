-- Adiciona coluna semana em individual_goal_overrides
-- 0 = todas as semanas do mês; 1-4 = semana específica (cronograma CGB)
ALTER TABLE individual_goal_overrides
  ADD COLUMN IF NOT EXISTS semana smallint NOT NULL DEFAULT 0;

-- Remove constraint antiga (matricula, ano, mes)
ALTER TABLE individual_goal_overrides
  DROP CONSTRAINT IF EXISTS individual_goal_overrides_matricula_ano_mes_key;

-- Nova constraint inclui semana para permitir overrides por semana específica
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'individual_goal_overrides'::regclass
    AND conname = 'individual_goal_overrides_matricula_ano_mes_semana_key'
  ) THEN
    ALTER TABLE individual_goal_overrides
      ADD CONSTRAINT individual_goal_overrides_matricula_ano_mes_semana_key
      UNIQUE (matricula, ano, mes, semana);
  END IF;
END $$;
