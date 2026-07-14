-- Fluxo de primeiro acesso: o usuário logado precisa ler o próprio
-- cadastro pendente e os próprios descritores para o login decidir o fluxo.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'pending_face_registrations'
      AND policyname = 'own_pending_regs_select'
  ) THEN
    CREATE POLICY own_pending_regs_select ON public.pending_face_registrations
      FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR email = auth.email());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'face_descriptors'
      AND policyname = 'own_descriptors_select'
  ) THEN
    CREATE POLICY own_descriptors_select ON public.face_descriptors
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;
