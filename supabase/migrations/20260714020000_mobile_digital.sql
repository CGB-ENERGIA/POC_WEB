-- Digital (WebAuthn) no PWA mobile: armazena o credential_id do dispositivo
-- vinculado à matrícula. Não requer aprovação do admin — é imediato.

CREATE TABLE IF NOT EXISTS public.mobile_device_credentials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula     text NOT NULL,
  nome          text NOT NULL,
  credential_id text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mobile_device_creds_matricula
  ON public.mobile_device_credentials (matricula);

ALTER TABLE public.mobile_device_credentials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='mobile_device_credentials' AND policyname='digital_anon_insert') THEN
    CREATE POLICY digital_anon_insert ON public.mobile_device_credentials
      FOR INSERT TO anon WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='mobile_device_credentials' AND policyname='digital_anon_select') THEN
    CREATE POLICY digital_anon_select ON public.mobile_device_credentials
      FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='mobile_device_credentials' AND policyname='digital_auth_select') THEN
    CREATE POLICY digital_auth_select ON public.mobile_device_credentials
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Verifica se a matrícula tem digital cadastrada
CREATE OR REPLACE FUNCTION public.mobile_digital_status(p_matricula text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.mobile_device_credentials WHERE matricula = p_matricula) THEN
    RETURN 'registered';
  END IF;
  RETURN 'none';
END; $$;
GRANT EXECUTE ON FUNCTION public.mobile_digital_status TO anon, authenticated;

-- Retorna os credential_ids da matrícula (para passar ao WebAuthn allowCredentials)
CREATE OR REPLACE FUNCTION public.mobile_digital_credentials(p_matricula text)
RETURNS TABLE(credential_id text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
    SELECT mdc.credential_id FROM public.mobile_device_credentials mdc
    WHERE mdc.matricula = p_matricula;
END; $$;
GRANT EXECUTE ON FUNCTION public.mobile_digital_credentials TO anon, authenticated;
