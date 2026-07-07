-- Tabela de observações do usuário no PWA (Minhas Observações).
-- Dados expiram automaticamente em 35 dias.
-- O checklist_submissions permanece intacto para o dashboard histórico.

CREATE TABLE IF NOT EXISTS public.user_observations (
  id          uuid        PRIMARY KEY,           -- mesmo client_id do checklist
  matricula   text        NOT NULL,
  observador  text        NOT NULL,
  auditagem   text        NOT NULL,
  data        timestamptz NOT NULL,
  base        text        NOT NULL,
  equipe      text        NOT NULL,
  resumo      jsonb       NOT NULL DEFAULT '{}',
  sync_status text        NOT NULL DEFAULT 'synced',
  expires_at  timestamptz NOT NULL DEFAULT NOW() + INTERVAL '35 days',
  created_at  timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_obs_matricula
  ON public.user_observations (matricula, expires_at DESC);

-- RLS: qualquer um pode ler/inserir (filtro por matricula feito na query)
ALTER TABLE public.user_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon leitura user_observations"
  ON public.user_observations FOR SELECT TO anon
  USING (expires_at > NOW());

CREATE POLICY "anon insercao user_observations"
  ON public.user_observations FOR INSERT TO anon
  WITH CHECK (true);

-- Cleanup automático: apaga registros expirados todo dia às 3h
SELECT cron.schedule(
  'cleanup-user-observations',
  '0 3 * * *',
  $$DELETE FROM public.user_observations WHERE expires_at < NOW();$$
);
