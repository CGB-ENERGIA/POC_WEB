-- Permite que usuários autenticados (admins do POC_OP) gerenciem o cadastro de employees.
-- A rota /cadastro-pwa já é protegida por requiresAdmin no router.

create policy employees_insert_authenticated
  on public.employees for insert to authenticated
  with check (true);

create policy employees_update_authenticated
  on public.employees for update to authenticated
  using (true)
  with check (true);

create policy employees_delete_authenticated
  on public.employees for delete to authenticated
  using (true);

-- Admins também precisam ver employees inativos para poder reativá-los.
drop policy if exists employees_read_anon on public.employees;

create policy employees_read_anon
  on public.employees for select to anon
  using (ativo = true);

create policy employees_read_authenticated
  on public.employees for select to authenticated
  using (true);
