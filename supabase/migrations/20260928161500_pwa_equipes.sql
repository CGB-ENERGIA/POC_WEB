create table if not exists public.pwa_equipes (
  id uuid primary key default gen_random_uuid(),
  prefixo text not null unique,
  base text not null,
  gerencia text not null,
  coordenador text not null default '',
  gerente text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.pwa_equipes enable row level security;

drop policy if exists pwa_equipes_select on public.pwa_equipes;
create policy pwa_equipes_select
  on public.pwa_equipes for select to anon, authenticated
  using (true);

drop policy if exists pwa_equipes_insert on public.pwa_equipes;
create policy pwa_equipes_insert
  on public.pwa_equipes for insert to anon, authenticated
  with check (true);

drop policy if exists pwa_equipes_update on public.pwa_equipes;
create policy pwa_equipes_update
  on public.pwa_equipes for update to anon, authenticated
  using (true)
  with check (true);

drop policy if exists pwa_equipes_delete on public.pwa_equipes;
create policy pwa_equipes_delete
  on public.pwa_equipes for delete to anon, authenticated
  using (true);
