-- Job diário às 3h: apaga submissions com mais de 35 dias.
-- O cascade remove automaticamente checklist_responses e checklist_photos.

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-observacoes-antigas',
  '0 3 * * *',
  $$
    DELETE FROM public.checklist_submissions
    WHERE created_at < NOW() - INTERVAL '35 days';
  $$
);
