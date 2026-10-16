-- Meta semanal FIXA por colaborador (painel > Metas > Exceções individuais).
-- Vale em todos os meses e semanas até ser removida. Exceções do mês/semana
-- (individual_goal_overrides) têm prioridade sobre a meta fixa, que por sua vez
-- tem prioridade sobre a meta da função/perfil.
create table if not exists public.metas_individual_fixa (
  matricula    text        primary key,
  nome         text        not null,
  meta_semanal integer     not null check (meta_semanal between 0 and 99),
  motivo       text        not null default '',
  updated_at   timestamptz not null default now()
);

alter table public.metas_individual_fixa enable row level security;

drop policy if exists metas_individual_fixa_select on public.metas_individual_fixa;
create policy metas_individual_fixa_select on public.metas_individual_fixa
  for select using (true);

drop policy if exists metas_individual_fixa_write on public.metas_individual_fixa;
create policy metas_individual_fixa_write on public.metas_individual_fixa
  for all to authenticated using (true) with check (true);
