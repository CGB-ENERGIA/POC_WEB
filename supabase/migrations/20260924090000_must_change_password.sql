-- Adiciona flag must_change_password em profiles.
-- Usuários criados em lote recebem true; ao trocar a senha o frontend seta false.

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

-- Permite que o próprio usuário atualize seu perfil (necessário para zerar a flag)
drop policy if exists "user update own profile" on public.profiles;
create policy "user update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
