-- "Minhas Observações" (PWA) lê user_observations, uma cópia do checklist. Quando um analista logado no painel aprova, reprova ou edita
-- o checklist oficial (checklist_submissions), a cópia não era atualizada: a tabela só tem política de leitura para anon, então o
-- UPDATE feito pelo painel (role authenticated) não enxergava a linha e não alterava nada.
-- Aqui o próprio banco mantém a cópia igual ao oficial (gatilho com SECURITY DEFINER), qualquer que seja quem alterou.

create or replace function public.sync_user_observation_from_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.client_id is not null then
    update public.user_observations
    set status = new.status,
        analisado_por = new.analisado_por,
        comentario_analise = new.comentario_analise,
        equipe = new.equipe,
        base = new.base,
        data = new.data,
        resumo = new.resumo
    where id = new.client_id
      and sync_status <> 'em_andamento';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_user_observation on public.checklist_submissions;
create trigger trg_sync_user_observation
  after update of status, analisado_por, comentario_analise, equipe, base, data, resumo
  on public.checklist_submissions
  for each row
  execute function public.sync_user_observation_from_submission();

-- Acerta as cópias que já ficaram para trás.
update public.user_observations u
set status = s.status,
    analisado_por = s.analisado_por,
    comentario_analise = s.comentario_analise,
    equipe = s.equipe,
    base = s.base,
    data = s.data,
    resumo = s.resumo
from public.checklist_submissions s
where s.client_id = u.id
  and u.sync_status <> 'em_andamento'
  and (
    u.status is distinct from s.status
    or u.analisado_por is distinct from s.analisado_por
    or u.comentario_analise is distinct from s.comentario_analise
    or u.equipe is distinct from s.equipe
    or u.base is distinct from s.base
    or u.data is distinct from s.data
    or u.resumo is distinct from s.resumo
  );
