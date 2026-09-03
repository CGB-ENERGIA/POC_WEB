-- Expande o constraint auditagem para incluir os novos tipos de checklist administrativo
ALTER TABLE public.checklist_submissions
  DROP CONSTRAINT IF EXISTS checklist_submissions_auditagem_check;

ALTER TABLE public.checklist_submissions
  ADD CONSTRAINT checklist_submissions_auditagem_check
  CHECK (auditagem IN ('GOMAN', 'GSTC', 'ADMINISTRATIVO', 'ALOJAMENTO', 'LOGISTICA', 'OFICINA'));
