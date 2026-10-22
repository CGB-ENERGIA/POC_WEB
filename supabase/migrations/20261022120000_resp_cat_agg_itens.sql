-- A pergunta "Cumpriu todas as regras de ouro" (goman-012 / gstc-021) tem 6 itens (Desligar, Bloquear, Sinalizar, Testar…)
-- e o BI conta cada item como uma observação (conforme ou não conforme). Aqui também: sem isso, cada checklist contava 1 conforme
-- onde o BI conta 6, e o total de conformidade ficava ~6% abaixo do BI. Conferido contra as planilhas de jan a set/2026.
create or replace function public.resp_cat_agg(p_ids uuid[])
returns table (submission_id uuid, cats jsonb)
language sql
stable
as $$
  select t.submission_id, jsonb_object_agg(t.cat, jsonb_build_array(t.conf, t.nc)) as cats
  from (
    select r.submission_id,
           coalesce(r.categoria, 'Sem categoria') as cat,
           sum(c.conf) as conf,
           sum(c.nc)   as nc
    from public.checklist_responses r
    cross join lateral (
      select
        case when r.pergunta_id in ('goman-012', 'gstc-021') then
               case when r.itens is not null
                      then (select count(*) from jsonb_array_elements(r.itens) e where (e ->> 'conforme')::boolean)
                    when r.resposta = 'conforme' then 6
                    else 5 end
             else (r.resposta = 'conforme')::int end as conf,
        case when r.pergunta_id in ('goman-012', 'gstc-021') then
               case when r.itens is not null
                      then (select count(*) from jsonb_array_elements(r.itens) e where not (e ->> 'conforme')::boolean)
                    when r.resposta = 'conforme' then 0
                    else 1 end
             else (r.resposta = 'nao_conforme')::int end as nc
    ) c
    where r.submission_id = any (p_ids)
    group by r.submission_id, coalesce(r.categoria, 'Sem categoria')
  ) t
  group by t.submission_id;
$$;

grant execute on function public.resp_cat_agg(uuid[]) to anon, authenticated;
