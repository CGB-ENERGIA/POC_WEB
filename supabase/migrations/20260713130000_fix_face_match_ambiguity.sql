-- Corrige "column reference descriptor is ambiguous" na face_match:
-- o parâmetro e a coluna da tabela têm o mesmo nome; qualifica com alias.
CREATE OR REPLACE FUNCTION public.face_match(descriptor float8[])
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  best_email text;
  best_dist  float8 := 999;
  cur_dist   float8;
  rec        RECORD;
BEGIN
  FOR rec IN SELECT fd.email, fd.descriptor AS stored FROM public.face_descriptors fd LOOP
    SELECT sqrt(sum((t.a - t.b)^2))
    INTO cur_dist
    FROM unnest(face_match.descriptor, rec.stored) AS t(a, b);

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

REVOKE EXECUTE ON FUNCTION public.face_match FROM anon, authenticated, public;
GRANT  EXECUTE ON FUNCTION public.face_match TO service_role;
