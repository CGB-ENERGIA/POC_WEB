-- Histórico das metas semanais por perfil (jul/2024 a set/2026), conforme regra informada:
--   2024 até set/2025 ........ meta geral 2 (todos os perfis)
--   out/2025 a jul/2026 ...... SESMT 5 (todo o SESMT é vinculado ao coordenador Daniel); demais 2
--   a partir de ago/2026 ..... SESMT 8; lideranças 4; encarregados seguem o valor configurado no mês (2)
-- Meses que já têm linha (ex.: out/2026) não são alterados.
insert into public.metas (ano, mes, normais_semanal, lideranca_semanal, seguranca_semanal)
select extract(year from d)::int,
       extract(month from d)::int,
       2,
       case when d >= date '2026-08-01' then 4 else 2 end,
       case when d >= date '2026-08-01' then 8
            when d >= date '2025-10-01' then 5
            else 2 end
from generate_series(date '2024-07-01', date '2026-09-01', interval '1 month') as d
on conflict (ano, mes) do nothing;

-- Meta fixa individual passa a ter início de vigência ("a partir de"); sem início = todos os meses.
alter table public.metas_individual_fixa
  add column if not exists desde_ano integer,
  add column if not exists desde_mes integer;

alter table public.metas_individual_fixa
  drop constraint if exists metas_individual_fixa_desde_check;
alter table public.metas_individual_fixa
  add constraint metas_individual_fixa_desde_check
  check ((desde_ano is null) = (desde_mes is null) and (desde_mes is null or desde_mes between 1 and 12));

-- As fixas já cadastradas (supervisores do SESMT com 4) valem a partir de ago/2026.
update public.metas_individual_fixa set desde_ano = 2026, desde_mes = 8 where desde_ano is null;
