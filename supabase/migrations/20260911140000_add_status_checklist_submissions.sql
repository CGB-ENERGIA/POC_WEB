-- Fluxo de validacao de checklists enviados: pendente -> aprovado/reprovado.
-- Somente checklists aprovados contam nas metricas/dashboards/paginas do POC_OP.
-- Registros existentes sao considerados aprovados (nao perdem historico).

ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS status text;
UPDATE public.checklist_submissions SET status = 'aprovado' WHERE status IS NULL;
ALTER TABLE public.checklist_submissions ALTER COLUMN status SET DEFAULT 'pendente';
ALTER TABLE public.checklist_submissions ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.checklist_submissions'::regclass
    AND conname = 'checklist_submissions_status_check'
  ) THEN
    ALTER TABLE public.checklist_submissions
      ADD CONSTRAINT checklist_submissions_status_check
      CHECK (status IN ('pendente', 'aprovado', 'reprovado'));
  END IF;
END $$;

ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS analisado_por text;
ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS data_analise timestamptz;
ALTER TABLE public.checklist_submissions ADD COLUMN IF NOT EXISTS comentario_analise text;

CREATE INDEX IF NOT EXISTS idx_checklist_submissions_status
  ON public.checklist_submissions (status);

-- Mesma logica em user_observations (usado no PWA "Minhas Observacoes")
ALTER TABLE public.user_observations ADD COLUMN IF NOT EXISTS status text;
UPDATE public.user_observations SET status = 'aprovado' WHERE status IS NULL;
ALTER TABLE public.user_observations ALTER COLUMN status SET DEFAULT 'pendente';
ALTER TABLE public.user_observations ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_observations'::regclass
    AND conname = 'user_observations_status_check'
  ) THEN
    ALTER TABLE public.user_observations
      ADD CONSTRAINT user_observations_status_check
      CHECK (status IN ('pendente', 'aprovado', 'reprovado'));
  END IF;
END $$;

-- Permite que a analise (admin, chave anon) atualize o status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'checklist_submissions' AND policyname = 'checklist_submissions_update_anon'
  ) THEN
    CREATE POLICY checklist_submissions_update_anon
      ON public.checklist_submissions FOR UPDATE TO anon, authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_observations' AND policyname = 'user_observations_update_anon'
  ) THEN
    CREATE POLICY user_observations_update_anon
      ON public.user_observations FOR UPDATE TO anon, authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;
