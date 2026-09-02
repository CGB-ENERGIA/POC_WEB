-- Exceções individuais de meta: permitem sobrescrever a meta de perfil
-- para um colaborador específico em um determinado mês.

CREATE TABLE IF NOT EXISTS public.individual_goal_overrides (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula    text         NOT NULL,
  nome         text         NOT NULL,
  ano          integer      NOT NULL,
  mes          integer      NOT NULL CHECK (mes BETWEEN 1 AND 12),
  meta_semanal numeric(5,2) NOT NULL CHECK (meta_semanal >= 0),
  motivo       text         NOT NULL DEFAULT '',
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (matricula, ano, mes)
);

CREATE INDEX IF NOT EXISTS idx_ind_goal_period
  ON public.individual_goal_overrides (ano, mes);

ALTER TABLE public.individual_goal_overrides ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='individual_goal_overrides' AND policyname='igo_select') THEN
    CREATE POLICY igo_select ON public.individual_goal_overrides
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='individual_goal_overrides' AND policyname='igo_all') THEN
    CREATE POLICY igo_all ON public.individual_goal_overrides
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
