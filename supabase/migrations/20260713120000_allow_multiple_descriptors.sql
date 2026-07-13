-- Multi-pose: um usuário pode ter várias linhas em face_descriptors (uma por pose).
-- Remove constraints únicas que impedem isso e mantém índice simples para busca.
ALTER TABLE public.face_descriptors DROP CONSTRAINT IF EXISTS face_descriptors_user_id_key;
ALTER TABLE public.face_descriptors DROP CONSTRAINT IF EXISTS face_descriptors_email_key;
CREATE INDEX IF NOT EXISTS idx_face_descriptors_user_id ON public.face_descriptors(user_id);
