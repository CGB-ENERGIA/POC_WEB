-- Hora autoritativa do servidor Postgres (para carimbo de fotos e registros)
create or replace function public.get_server_time()
returns timestamptz
language sql
stable
security invoker
set search_path = public
as $$
  select now();
$$;

revoke all on function public.get_server_time() from public;
grant execute on function public.get_server_time() to anon, authenticated;
