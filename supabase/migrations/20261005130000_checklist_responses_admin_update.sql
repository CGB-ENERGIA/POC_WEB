-- Permite que usuários autenticados (admins do POC_OP) corrijam respostas de checklists
-- na tela de Análise. O PWA (anon) continua sem poder alterar respostas já enviadas.
create policy checklist_responses_update_authenticated
  on public.checklist_responses for update to authenticated
  using (true)
  with check (true);
