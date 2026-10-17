-- Registro de acidentes por equipe (prefixo) e data, exibido no Histórico ICIT ("Acidentes: N", filtro Acidentes
-- e "Histórico de Acidentes" no detalhe da célula). Leitura e escrita só para quem está logado no painel.
create table if not exists public.acidentes (
  id          uuid        primary key default gen_random_uuid(),
  data        date        not null,
  prefixo     text        not null,   -- prefixo da equipe, sempre em MAIÚSCULAS
  descricao   text        not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists idx_acidentes_data on public.acidentes (data);
create index if not exists idx_acidentes_prefixo on public.acidentes (prefixo);

alter table public.acidentes enable row level security;

drop policy if exists acidentes_select on public.acidentes;
create policy acidentes_select on public.acidentes
  for select to authenticated using (true);

drop policy if exists acidentes_write on public.acidentes;
create policy acidentes_write on public.acidentes
  for all to authenticated using (true) with check (true);
