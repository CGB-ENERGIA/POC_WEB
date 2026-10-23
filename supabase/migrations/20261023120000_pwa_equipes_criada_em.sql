-- Data a partir da qual a equipe existe. O relatório de equipes (visitadas / não visitadas) só considera a equipe nos períodos
-- a partir dessa data: uma equipe cadastrada em outubro não pode aparecer como "não visitada" em setembro.
-- updated_at não serve (é a última alteração; o cadastro inteiro foi regravado em 28/09/2026), então a data é deduzida do que o banco prova:
--   * cadastradas depois de 28/09/2026: a menor entre a data do cadastro e a da 1ª visita (checklist) da equipe;
--   * cadastro anterior: a data da 1ª visita; sem nenhuma visita, 28/09/2026 (a data em que o cadastro atual foi carregado).
-- Equipes novas passam a receber a data do dia do cadastro.
alter table public.pwa_equipes add column if not exists criada_em date;

with primeira as (
  select upper(trim(split_part(equipe, ' - ', 1))) as k, min(data)::date as d
  from public.checklist_submissions group by 1
)
update public.pwa_equipes p
set criada_em = case
      when p.updated_at::date > date '2026-09-28'
        then least(p.updated_at::date, coalesce(f.d, p.updated_at::date))
      else coalesce(f.d, date '2026-09-28')
    end
from (select id, upper(trim(prefixo)) as k from public.pwa_equipes) x
left join primeira f on f.k = x.k
where x.id = p.id and p.criada_em is null;

alter table public.pwa_equipes alter column criada_em set default current_date;
