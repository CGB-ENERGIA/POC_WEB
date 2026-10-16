-- Performance para períodos longos (histórico 2024-2026: ~1,1 milhão de respostas).
-- 1) Índice parcial: telas de ICIT / tendência só precisam das respostas não conformes.
create index if not exists idx_checklist_responses_nc
  on public.checklist_responses (submission_id)
  where resposta = 'nao_conforme';

-- 2) Filtros por período + status em checklist_submissions.
create index if not exists idx_checklist_submissions_status_data
  on public.checklist_submissions (status, data);

-- 3) Conformes / não conformes por categoria, uma linha por checklist.
--    Evita baixar centenas de milhares de respostas para montar os gráficos mensais por categoria.
create or replace function public.resp_cat_agg(p_ids uuid[])
returns table (submission_id uuid, cats jsonb)
language sql
stable
as $$
  select t.submission_id, jsonb_object_agg(t.cat, jsonb_build_array(t.conf, t.nc)) as cats
  from (
    select r.submission_id,
           coalesce(r.categoria, 'Sem categoria') as cat,
           count(*) filter (where r.resposta = 'conforme')     as conf,
           count(*) filter (where r.resposta = 'nao_conforme') as nc
    from public.checklist_responses r
    where r.submission_id = any (p_ids)
    group by r.submission_id, coalesce(r.categoria, 'Sem categoria')
  ) t
  group by t.submission_id;
$$;

grant execute on function public.resp_cat_agg(uuid[]) to anon, authenticated;
