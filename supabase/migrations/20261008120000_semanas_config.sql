-- Cronograma das semanas de observação, por mês. Configurável no painel (Metas).
-- Semana 1 = dia 1 até fim_s1; semana 2 = fim_s1+1 até fim_s2; semana 3 = fim_s2+1 até fim_s3;
-- semana 4 = fim_s3+1 até o último dia do mês. Mês sem linha usa o padrão 8/15/22.
create table if not exists public.semanas_config (
  ano        integer     not null,
  mes        integer     not null check (mes between 1 and 12),
  fim_s1     integer     not null,
  fim_s2     integer     not null,
  fim_s3     integer     not null,
  updated_at timestamptz not null default now(),
  primary key (ano, mes),
  constraint semanas_config_ordem check (fim_s1 >= 1 and fim_s1 < fim_s2 and fim_s2 < fim_s3 and fim_s3 <= 30)
);

alter table public.semanas_config enable row level security;

-- Leitura pública: o PWA (anon) precisa saber em que semana está.
create policy semanas_config_select on public.semanas_config
  for select using (true);

-- Escrita só para quem está logado no painel.
create policy semanas_config_write on public.semanas_config
  for all to authenticated using (true) with check (true);
