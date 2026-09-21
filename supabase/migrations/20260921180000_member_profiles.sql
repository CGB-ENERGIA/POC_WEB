-- Perfis de acesso: introduz um papel "member" (somente páginas de
-- gráficos/visões) sem alterar o comportamento de nenhuma conta existente.
-- Ausência de linha em profiles (ou role != 'member') continua liberando
-- acesso total, exatamente como hoje.

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "select own profile" on public.profiles;
create policy "select own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists "admin select all profiles" on public.profiles;
create policy "admin select all profiles" on public.profiles
  for select to authenticated
  using (auth.email() = 'italo.fontes@cgbengenharia.com.br');

-- Usuário de teste com acesso restrito a gráficos/visões
-- (login: membro.teste@cgbengenharia.com.br / senha: Membro@Teste2026)
do $$
declare
  new_uid uuid := gen_random_uuid();
  tmp_pass text := 'Membro@Teste2026';
begin
  set local search_path = public, extensions;

  if not exists (select 1 from auth.users where email = 'membro.teste@cgbengenharia.com.br') then
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at
    ) values (
      new_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'membro.teste@cgbengenharia.com.br', crypt(tmp_pass, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Membro Teste"}'::jsonb, false, now(), now()
    );

    insert into auth.identities (
      provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at
    ) values (
      'membro.teste@cgbengenharia.com.br', new_uid,
      jsonb_build_object('sub', new_uid::text, 'email', 'membro.teste@cgbengenharia.com.br'),
      'email', now(), now(), now()
    );

    insert into public.profiles (id, email, role)
    values (new_uid, 'membro.teste@cgbengenharia.com.br', 'member');
  end if;
end $$;
