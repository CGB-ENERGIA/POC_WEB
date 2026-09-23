-- Adiciona permissões de UPDATE e DELETE para nc_resolucoes.
-- A tabela foi criada manualmente no dashboard sem estas políticas,
-- o que fazia o admin não conseguir aprovar/reprovar resoluções
-- (UPDATE retornava sem erro mas 0 linhas afetadas por bloqueio RLS).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename   = 'nc_resolucoes'
      AND policyname  = 'nc_resolucoes_update_anon'
  ) THEN
    CREATE POLICY nc_resolucoes_update_anon
      ON public.nc_resolucoes FOR UPDATE TO anon, authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename   = 'nc_resolucoes'
      AND policyname  = 'nc_resolucoes_delete_anon'
  ) THEN
    CREATE POLICY nc_resolucoes_delete_anon
      ON public.nc_resolucoes FOR DELETE TO anon, authenticated
      USING (true);
  END IF;
END $$;
