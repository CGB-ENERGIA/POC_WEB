-- Face ID no PWA mobile (checklist de campo):
-- o colaborador é identificado por MATRÍCULA (sem conta no Supabase Auth),
-- então a facial é vinculada à matrícula em tabelas próprias.
-- Fluxo: 1º acesso → cadastro em 3 poses → aprovação do admin no dashboard
-- → entradas seguintes exclusivamente por reconhecimento facial.

-- ── Tabelas ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mobile_face_pending (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula    text NOT NULL,
  nome         text NOT NULL,
  descriptors  jsonb NOT NULL,
  photo_base64 text,
  status       text NOT NULL DEFAULT 'pending',
  created_at   timestamptz DEFAULT now(),
  reviewed_at  timestamptz,
  reviewed_by  text,
  CONSTRAINT mobile_valid_status CHECK (status IN ('pending','approved','rejected'))
);

CREATE TABLE IF NOT EXISTS public.mobile_face_descriptors (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula  text NOT NULL,
  nome       text NOT NULL,
  descriptor float8[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mobile_face_descriptors_matricula
  ON public.mobile_face_descriptors (matricula);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Descritores nunca são lidos direto pelo cliente: só via funções SECURITY DEFINER.

ALTER TABLE public.mobile_face_pending     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_face_descriptors ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='mobile_face_pending' AND policyname='mobile_anon_insert') THEN
    CREATE POLICY mobile_anon_insert ON public.mobile_face_pending
      FOR INSERT TO anon WITH CHECK (status = 'pending');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='mobile_face_pending' AND policyname='mobile_auth_select') THEN
    CREATE POLICY mobile_auth_select ON public.mobile_face_pending
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- ── Status do cadastro por matrícula (chamado pelo PWA antes de entrar) ─────

CREATE OR REPLACE FUNCTION public.mobile_face_status(p_matricula text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.mobile_face_descriptors WHERE matricula = p_matricula) THEN
    RETURN 'approved';
  END IF;
  IF EXISTS (SELECT 1 FROM public.mobile_face_pending
             WHERE matricula = p_matricula AND status = 'pending') THEN
    RETURN 'pending';
  END IF;
  RETURN 'none';
END; $$;

GRANT EXECUTE ON FUNCTION public.mobile_face_status TO anon, authenticated;

-- ── Reconhecimento facial (retorna a matrícula do melhor match) ─────────────

CREATE OR REPLACE FUNCTION public.mobile_face_match(p_descriptor float8[])
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  best_matricula text;
  best_nome      text;
  best_dist      float8 := 999;
  cur_dist       float8;
  rec            RECORD;
BEGIN
  FOR rec IN SELECT mfd.matricula, mfd.nome, mfd.descriptor AS stored
             FROM public.mobile_face_descriptors mfd LOOP
    SELECT sqrt(sum((t.a - t.b)^2))
    INTO cur_dist
    FROM unnest(p_descriptor, rec.stored) AS t(a, b);

    IF cur_dist < best_dist THEN
      best_dist      := cur_dist;
      best_matricula := rec.matricula;
      best_nome      := rec.nome;
    END IF;
  END LOOP;

  IF best_dist >= 0.6 THEN
    RETURN json_build_object('error', 'not_recognized', 'distance', best_dist);
  END IF;

  RETURN json_build_object('matricula', best_matricula, 'nome', best_nome, 'distance', best_dist);
END; $$;

GRANT EXECUTE ON FUNCTION public.mobile_face_match TO anon, authenticated;

-- ── Aprovação / rejeição / remoção (admin, via dashboard) ───────────────────

CREATE OR REPLACE FUNCTION public.approve_mobile_face_registration(reg_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  reg public.mobile_face_pending;
  d   jsonb;
BEGIN
  SELECT * INTO reg FROM public.mobile_face_pending WHERE id = reg_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Cadastro não encontrado ou já processado');
  END IF;

  -- Substitui descritores antigos da matrícula pelos novos
  DELETE FROM public.mobile_face_descriptors WHERE matricula = reg.matricula;

  FOR d IN SELECT jsonb_array_elements(reg.descriptors) LOOP
    INSERT INTO public.mobile_face_descriptors (matricula, nome, descriptor)
    VALUES (reg.matricula, reg.nome,
      (SELECT array_agg(x::float8) FROM jsonb_array_elements_text(d) AS x));
  END LOOP;

  UPDATE public.mobile_face_pending
  SET status = 'approved', reviewed_at = now(), reviewed_by = auth.email()
  WHERE id = reg_id;

  RETURN json_build_object('success', true);
END; $$;

CREATE OR REPLACE FUNCTION public.reject_mobile_face_registration(reg_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.mobile_face_pending
  SET status = 'rejected', reviewed_at = now(), reviewed_by = auth.email()
  WHERE id = reg_id AND status = 'pending';
END; $$;

CREATE OR REPLACE FUNCTION public.remove_mobile_face_registration(reg_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  reg public.mobile_face_pending;
BEGIN
  SELECT * INTO reg FROM public.mobile_face_pending WHERE id = reg_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Registro não encontrado');
  END IF;

  DELETE FROM public.mobile_face_descriptors WHERE matricula = reg.matricula;
  DELETE FROM public.mobile_face_pending WHERE id = reg_id;

  RETURN json_build_object('success', true);
END; $$;

GRANT EXECUTE ON FUNCTION public.approve_mobile_face_registration TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_mobile_face_registration  TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_mobile_face_registration  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.approve_mobile_face_registration FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reject_mobile_face_registration  FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.remove_mobile_face_registration  FROM anon, public;
