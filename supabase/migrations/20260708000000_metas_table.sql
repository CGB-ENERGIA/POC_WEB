-- Tabela de metas por mês/perfil, configurável pelos admins no dashboard
create table if not exists public.metas (
  ano               integer      not null,
  mes               integer      not null check (mes between 1 and 12),
  normais_semanal   integer      not null default 2,
  seguranca_semanal integer      not null default 5,
  updated_at        timestamptz  not null default now(),
  primary key (ano, mes)
);

-- RLS: leitura pública (app anon), escrita pública (sem auth no projeto)
alter table public.metas enable row level security;

create policy "metas_select" on public.metas
  for select using (true);

create policy "metas_upsert" on public.metas
  for all using (true) with check (true);
