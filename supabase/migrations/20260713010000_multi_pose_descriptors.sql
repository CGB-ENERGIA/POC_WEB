-- Cadastro facial em múltiplas poses:
-- pending_face_registrations.descriptors guarda as 3 poses (jsonb),
-- e a aprovação insere uma linha em face_descriptors por pose.
-- face_match já compara contra todas as linhas — nada muda no login.

ALTER TABLE public.pending_face_registrations
  ADD COLUMN IF NOT EXISTS descriptors jsonb;

CREATE OR REPLACE FUNCTION public.approve_face_registration(reg_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  reg public.pending_face_registrations;
  uid uuid;
  tok text := gen_random_uuid()::text;
  d   jsonb;
BEGIN
  SELECT * INTO reg FROM public.pending_face_registrations WHERE id = reg_id AND status = 'pending';
  IF NOT FOUND THEN RETURN json_build_object('error','Cadastro não encontrado ou já processado'); END IF;

  -- Resolve o usuário: pelo user_id do registro OU pelo e-mail
  uid := reg.user_id;
  IF uid IS NULL THEN
    SELECT id INTO uid FROM auth.users WHERE email = reg.email;
  END IF;

  IF uid IS NULL THEN
    -- Usuário realmente novo: cria a conta
    uid := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
    VALUES (uid,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
      reg.email, extensions.crypt(tok, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', reg.name), false, now(), now());
    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
    VALUES (reg.email, uid,
      jsonb_build_object('sub', uid::text, 'email', reg.email, 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now());
  END IF;

  -- Substitui os descritores antigos pelos novos (senha NUNCA é alterada)
  DELETE FROM public.face_descriptors WHERE user_id = uid;

  IF reg.descriptors IS NOT NULL AND jsonb_typeof(reg.descriptors) = 'array' THEN
    FOR d IN SELECT jsonb_array_elements(reg.descriptors) LOOP
      INSERT INTO public.face_descriptors (user_id, email, descriptor, face_token)
      VALUES (uid, reg.email,
        (SELECT array_agg(x::float8) FROM jsonb_array_elements_text(d) AS x),
        tok);
    END LOOP;
  ELSE
    INSERT INTO public.face_descriptors (user_id, email, descriptor, face_token)
    VALUES (uid, reg.email, reg.descriptor, tok);
  END IF;

  UPDATE public.pending_face_registrations
  SET status = 'approved', reviewed_at = now(), reviewed_by = auth.email()
  WHERE id = reg_id;
  RETURN json_build_object('success', true);
END; $$;

GRANT EXECUTE ON FUNCTION public.approve_face_registration TO authenticated;
