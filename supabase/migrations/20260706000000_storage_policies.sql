-- Política de upload para o bucket checklist-photos (Supabase Storage)
-- Permite que qualquer usuário autenticado OU anônimo faça upload de fotos de checklist.

insert into storage.buckets (id, name, public)
values ('checklist-photos', 'checklist-photos', true)
on conflict (id) do update set public = true;

-- Qualquer um pode fazer upload (anon key do mobile é suficiente)
create policy "anon pode upload checklist-photos"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'checklist-photos');

-- Qualquer um pode ler (bucket público)
create policy "leitura publica checklist-photos"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'checklist-photos');
