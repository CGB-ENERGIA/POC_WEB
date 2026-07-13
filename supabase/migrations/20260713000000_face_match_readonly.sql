-- Login facial sem alterar senha:
-- face_match apenas COMPARA o descritor e retorna o e-mail do melhor match.
-- Quem cria a sessão é a Edge Function face-login (magic link via API admin).

-- Remove a função antiga que sobrescrevia a senha do usuário
DROP FUNCTION IF EXISTS public.face_authenticate(double precision[]);

CREATE OR REPLACE FUNCTION public.face_match(descriptor float8[])
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  best_email text;
  best_dist  float8 := 999;
  cur_dist   float8;
  rec        RECORD;
BEGIN
  FOR rec IN SELECT email, descriptor AS stored FROM public.face_descriptors LOOP
    SELECT sqrt(sum((a - b)^2))
    INTO cur_dist
    FROM unnest(descriptor, rec.stored) AS t(a, b);

    IF cur_dist < best_dist THEN
      best_dist  := cur_dist;
      best_email := rec.email;
    END IF;
  END LOOP;

  IF best_dist >= 0.6 THEN
    RETURN json_build_object('error', 'not_recognized', 'distance', best_dist);
  END IF;

  RETURN json_build_object('email', best_email, 'distance', best_dist);
END; $$;

-- Só a service_role (Edge Function) pode chamar — o cliente nunca acessa direto
REVOKE EXECUTE ON FUNCTION public.face_match FROM anon, authenticated, public;
GRANT  EXECUTE ON FUNCTION public.face_match TO service_role;
