-- Limite de 'foto parecida' de 4 para 2 bits (de 64): com 9 mil fotos reais, distâncias 3-4 já eram ruído e uniam fotos diferentes.
create or replace function public.fotos_repetidas(
  p_sha     text[],
  p_dhash   text[] default '{}',
  p_excluir uuid   default null
)
returns table (
  photo_id      uuid,
  submission_id uuid,
  tipo          text,                -- 'identica' | 'parecida'
  sha256        text,
  dhash         text,
  r2_key        text,
  sort_order    int,
  data          timestamptz,
  equipe        text,
  observador    text,
  base          text,
  distancia     int
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.submission_id,
         case when p.sha256 = any(p_sha) then 'identica' else 'parecida' end,
         p.sha256, p.dhash, p.r2_key, p.sort_order,
         s.data, s.equipe, s.observador, s.base,
         coalesce((
           select min(bit_count(('x' || q)::bit(64) # ('x' || p.dhash)::bit(64)))
           from unnest(p_dhash) q
           where p.dhash is not null
         ), 64)::int
  from public.checklist_photos p
  join public.checklist_submissions s on s.id = p.submission_id
  where p.tipo = 'local'
    and (p_excluir is null or p.submission_id <> p_excluir)
    and (
      p.sha256 = any(p_sha)
      or (
        p.dhash is not null
        and bit_count(('x' || p.dhash)::bit(64)) between 12 and 52
        and exists (
          select 1 from unnest(p_dhash) q
          where bit_count(('x' || q)::bit(64)) between 12 and 52
            and bit_count(('x' || q)::bit(64) # ('x' || p.dhash)::bit(64)) <= 2
        )
      )
    )
  order by s.data desc
  limit 60;
$$;

grant execute on function public.fotos_repetidas(text[], text[], uuid) to anon, authenticated;

-- Para o selo "Foto repetida" na lista: de uma lista de checklists, quais têm foto repetida em OUTRO checklist.
-- so_reenvio = todas as repetições são da mesma equipe no mesmo dia (provável reenvio do mesmo checklist).
create or replace function public.submissions_com_foto_repetida(p_ids uuid[])
returns table (submission_id uuid, so_reenvio boolean)
language sql stable security definer set search_path = public
as $$
  select a.submission_id,
         bool_and(sa.equipe = sb.equipe and (sa.data at time zone 'America/Fortaleza')::date = (sb.data at time zone 'America/Fortaleza')::date)
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
