-- Proteção: remove_face_user nunca pode apagar o admin nem a própria conta
CREATE OR REPLACE FUNCTION public.remove_face_user(reg_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  reg public.pending_face_registrations;
  uid uuid;
BEGIN
  SELECT * INTO reg FROM public.pending_face_registrations WHERE id = reg_id;
  IF NOT FOUND THEN RETURN json_build_object('error','Registro não encontrado'); END IF;

  -- Nunca remover o administrador
  IF reg.email = 'italo.fontes@cgbengenharia.com.br' THEN
    RETURN json_build_object('error','A conta do administrador não pode ser removida');
  END IF;

  -- Nunca remover a própria conta logada
  IF reg.email = auth.email() THEN
    RETURN json_build_object('error','Você não pode remover a própria conta');
  END IF;

  uid := reg.user_id;
  IF uid IS NULL THEN
    SELECT id INTO uid FROM auth.users WHERE email = reg.email;
  END IF;

  -- Remove descritores e histórico de cadastro
  DELETE FROM public.face_descriptors WHERE email = reg.email OR (uid IS NOT NULL AND user_id = uid);
  DELETE FROM public.pending_face_registrations WHERE email = reg.email;

  -- Remove a conta de autenticação (apenas de não-admins)
  IF uid IS NOT NULL THEN
    DELETE FROM auth.identities WHERE user_id = uid;
    DELETE FROM auth.sessions   WHERE user_id = uid;
    DELETE FROM auth.mfa_factors WHERE user_id = uid;
    DELETE FROM auth.users WHERE id = uid;
  END IF;

  RETURN json_build_object('success', true);
END $$;

GRANT EXECUTE ON FUNCTION public.remove_face_user TO authenticated;
