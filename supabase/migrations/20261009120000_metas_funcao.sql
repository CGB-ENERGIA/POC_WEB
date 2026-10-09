-- Meta semanal por função, por mês (painel > Metas > "Metas por função").
-- `funcao` é a chave normalizada (minúsculas, sem acento/pontuação); `rotulo` é o nome para exibir.
-- Função sem linha usa o padrão do perfil (Encarregado / Lideranças) da tabela `metas`.
create table if not exists public.metas_funcao (
  ano          integer     not null,
  mes          integer     not null check (mes between 1 and 12),
  funcao       text        not null,
  rotulo       text        not null default '',
  meta_semanal integer     not null check (meta_semanal between 0 and 99),
  updated_at   timestamptz not null default now(),
  primary key (ano, mes, funcao)
);

alter table public.metas_funcao enable row level security;

-- Leitura pública: o PWA (anon) precisa da meta para mostrar o progresso.
drop policy if exists metas_funcao_select on public.metas_funcao;
create policy metas_funcao_select on public.metas_funcao
  for select using (true);

-- Escrita só para quem está logado no painel.
drop policy if exists metas_funcao_write on public.metas_funcao;
create policy metas_funcao_write on public.metas_funcao
  for all to authenticated using (true) with check (true);
