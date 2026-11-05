-- Excluir colaborador no Banco de Dados PWA (aba Geral) não apagava nada: a tabela tinha política de
-- select/insert/update, mas nenhuma de delete, então o DELETE respondia "ok" sem remover a linha.
drop policy if exists pwa_colaboradores_delete on public.pwa_colaboradores;
create policy pwa_colaboradores_delete
  on public.pwa_colaboradores for delete to authenticated
  using (true);

grant delete on public.pwa_colaboradores to authenticated;
