-- Adiciona campos de análise em user_observations para que o PWA do colaborador
-- possa exibir o resultado da revisão (aprovado/reprovado) e o motivo da reprovação.
ALTER TABLE user_observations
  ADD COLUMN IF NOT EXISTS comentario_analise text,
  ADD COLUMN IF NOT EXISTS analisado_por      text;
