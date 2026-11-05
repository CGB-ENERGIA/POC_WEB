-- Selo "Foto repetida" da lista: repetição que se explica por reenvio não conta como reaproveitamento.
-- so_reenvio = todas as repetições são da mesma equipe E (no mesmo dia OU o checklist mais antigo foi reprovado).
create or replace function public.submissions_com_foto_repetida(p_ids uuid[])
returns table (submission_id uuid, so_reenvio boolean)
language sql stable security definer set search_path = public
as $$
  select a.submission_id,
         bool_and(
           sa.equipe = sb.equipe
           and (
             (sa.data at time zone 'America/Fortaleza')::date = (sb.data at time zone 'America/Fortaleza')::date
             or (case when sb.created_at < sa.created_at then sb.status else sa.status end) = 'reprovado'
           )
         )
  from public.checklist_photos a
  join public.checklist_submissions sa on sa.id = a.submission_id
  join public.checklist_photos b
    on b.tipo = 'local' and b.submission_id <> a.submission_id
   and (
     (a.sha256 is not null and b.sha256 = a.sha256)
     or (
       a.dhash is not null and b.dhash is not null
       and bit_count(('x' || a.dhash)::bit(64)) between 12 and 52
       and bit_count(('x' || b.dhash)::bit(64)) between 12 and 52
       and bit_count(('x' || a.dhash)::bit(64) # ('x' || b.dhash)::bit(64)) <= 2
     )
   )
  join public.checklist_submissions sb on sb.id = b.submission_id
  where a.tipo = 'local' and a.submission_id = any(p_ids)
  group by a.submission_id;
$$;

grant execute on function public.submissions_com_foto_repetida(uuid[]) to anon, authenticated;
