create table if not exists public.pwa_colaboradores (
  chapa text primary key,
  nome text not null,
  funcao text not null default '',
  base text not null default '',
  rateio text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.pwa_colaboradores enable row level security;

drop policy if exists pwa_colaboradores_select on public.pwa_colaboradores;
create policy pwa_colaboradores_select
  on public.pwa_colaboradores for select to anon, authenticated
  using (true);

drop policy if exists pwa_colaboradores_insert on public.pwa_colaboradores;
create policy pwa_colaboradores_insert
  on public.pwa_colaboradores for insert to anon, authenticated
  with check (true);

drop policy if exists pwa_colaboradores_update on public.pwa_colaboradores;
create policy pwa_colaboradores_update
  on public.pwa_colaboradores for update to anon, authenticated
  using (true) with check (true);

grant select, insert, update on public.pwa_colaboradores to anon, authenticated;
