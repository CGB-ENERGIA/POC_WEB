-- Upsert de colaborador via função (evita policy INSERT aberta em employees)
create or replace function public.ensure_employee(
  p_matricula text,
  p_nome text,
  p_nome_completo text,
  p_gerencia text,
  p_base text,
  p_funcao text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.employees (
    matricula, nome, nome_completo, gerencia, base, funcao
  )
  values (
    p_matricula, p_nome, p_nome_completo, p_gerencia, p_base, p_funcao
  )
  on conflict (matricula) do update set
    nome = excluded.nome,
    nome_completo = excluded.nome_completo,
    gerencia = excluded.gerencia,
    base = excluded.base,
    funcao = excluded.funcao,
    updated_at = now();
end;
$$;

revoke all on function public.ensure_employee(text, text, text, text, text, text) from public;
grant execute on function public.ensure_employee(text, text, text, text, text, text) to anon, authenticated;
