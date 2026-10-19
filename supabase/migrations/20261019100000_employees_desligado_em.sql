-- Data de desligamento do colaborador. O histórico (checklists, metas) é preservado; a pessoa deixa de aparecer
-- nas listas e metas dos períodos que começam DEPOIS desta data. Vazio = está no quadro.
alter table public.employees add column if not exists desligado_em date;

-- O PWA (anon) deixa de enxergar quem já saiu do quadro (não identifica nem aparece nas listas).
-- O painel (authenticated) continua vendo todos, para poder mostrar os períodos em que a pessoa ainda trabalhava.
drop policy if exists employees_read_anon on public.employees;
create policy employees_read_anon
  on public.employees for select to anon
  using (ativo = true and (desligado_em is null or desligado_em >= current_date));
