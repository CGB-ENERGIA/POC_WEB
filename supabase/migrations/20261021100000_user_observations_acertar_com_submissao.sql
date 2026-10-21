-- "Minhas Observações" (PWA) lê user_observations, uma cópia do checklist. Em alguns casos (rascunho retomado dias depois,
-- ou rascunho que virou outro checklist) a cópia ficou com data, equipe ou resumo diferentes do checklist oficial
-- (checklist_submissions). Acerta as cópias já enviadas pelo oficial; o app também passou a ler o oficial.
update public.user_observations u
set equipe = s.equipe,
    base = s.base,
    data = s.data,
    resumo = s.resumo
from public.checklist_submissions s
where s.client_id = u.id
  and u.sync_status <> 'em_andamento'
  and (
    u.equipe is distinct from s.equipe
    or u.base is distinct from s.base
    or u.data is distinct from s.data
    or (u.resumo ->> 'naoConformes') is distinct from (s.resumo ->> 'naoConformes')
    or (u.resumo ->> 'conformes') is distinct from (s.resumo ->> 'conformes')
  );
