-- Administradores com acesso total: italo.fontes e marcus.vinicius.
-- Mesma lista de POC_OP/src/lib/admins.ts e da função create-user.

create or replace function public.eh_admin_mestre(p_email text)
returns boolean
language sql immutable
as $$
  select lower(coalesce(p_email, '')) in (
    'italo.fontes@cgbengenharia.com.br',
    'marcus.vinicius@cgbengenharia.com.br'
  );
$$;

-- Administradores enxergam todos os perfis (tela de usuários em Aprovações).
drop policy if exists "admin select all profiles" on public.profiles;
create policy "admin select all profiles" on public.profiles
  for select to authenticated
  using (public.eh_admin_mestre(auth.email()));

-- Marcus também fica com papel "admin" no perfil (cobre as telas que olham o papel, não o e-mail).
insert into public.profiles (id, email, role)
select u.id, u.email, 'admin'
from auth.users u
where lower(u.email) = 'marcus.vinicius@cgbengenharia.com.br'
on conflict (id) do update set role = 'admin';

-- Contas de administrador nunca podem ser removidas por remove_face_user.
create or replace function public.remove_face_user(reg_id uuid)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  reg public.pending_face_registrations;
  uid uuid;
begin
  select * into reg from public.pending_face_registrations where id = reg_id;
  if not found then return json_build_object('error','Registro não encontrado'); end if;

  if public.eh_admin_mestre(reg.email) then
    return json_build_object('error','A conta de um administrador não pode ser removida');
  end if;

  if reg.email = auth.email() then
    return json_build_object('error','Você não pode remover a própria conta');
  end if;

  uid := reg.user_id;
  if uid is null then
    select id into uid from auth.users where email = reg.email;
  end if;

  delete from public.face_descriptors where email = reg.email or (uid is not null and user_id = uid);
  delete from public.pending_face_registrations where email = reg.email;

  if uid is not null then
    delete from auth.identities where user_id = uid;
    delete from auth.sessions   where user_id = uid;
    delete from auth.mfa_factors where user_id = uid;
    delete from auth.users where id = uid;
  end if;

  return json_build_object('success', true);
end $$;

grant execute on function public.remove_face_user to authenticated;
