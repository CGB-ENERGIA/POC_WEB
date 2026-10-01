-- Políticas RLS para o bucket "galeria-fotos" no Supabase Storage
-- Execute no SQL Editor do Dashboard: https://supabase.com/dashboard/project/uqjabgsxzeekxznybhns/sql

-- INSERT: permite que qualquer usuário (anon + authenticated) faça upload
CREATE POLICY "Allow anon insert galeria-fotos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'galeria-fotos');

-- SELECT: permite leitura pública
CREATE POLICY "Allow anon select galeria-fotos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'galeria-fotos');

-- DELETE: permite exclusão pelo usuário anon/authenticated
CREATE POLICY "Allow anon delete galeria-fotos"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'galeria-fotos');
