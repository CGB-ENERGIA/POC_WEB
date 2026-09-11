-- Atribuicao da nao conformidade: equipe completa ou membro especifico
ALTER TABLE public.checklist_responses
  ADD COLUMN IF NOT EXISTS atribuido_tipo text CHECK (atribuido_tipo IN ('equipe', 'membro'));

ALTER TABLE public.checklist_responses
  ADD COLUMN IF NOT EXISTS atribuido_nome text;

ALTER TABLE public.checklist_responses
  ADD COLUMN IF NOT EXISTS atribuido_matricula text;
