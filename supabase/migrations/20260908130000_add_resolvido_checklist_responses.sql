-- Registra se uma nao conformidade foi resolvida no momento da auditoria (pergunta obrigatoria no PWA).
-- null = registros antigos, anteriores a esta feature (tratados como nao resolvidos p/ compatibilidade).
ALTER TABLE public.checklist_responses
  ADD COLUMN IF NOT EXISTS resolvido boolean;
