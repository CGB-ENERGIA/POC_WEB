-- ROLLBACK da importação da Base POC 4.0 (jul/2024 a set/2026).
-- Só apaga o que a importação criou. Os checklists de outubro/2026 em diante NÃO são tocados.
-- Respostas saem junto (on delete cascade). Rode UM bloco por vez no SQL Editor do Supabase.
-- Se algum bloco der timeout, rode-o de novo: ele apaga em partes de 500 checklists.

-- ========== PASSO 1: checklists + respostas (um bloco por mês) ==========
-- 07/2024
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2024-07-01' and data < '2024-08-01' limit 500
);

-- 08/2024
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2024-08-01' and data < '2024-09-01' limit 500
);

-- 09/2024
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2024-09-01' and data < '2024-10-01' limit 500
);

-- 10/2024
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2024-10-01' and data < '2024-11-01' limit 500
);

-- 11/2024
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2024-11-01' and data < '2024-12-01' limit 500
);

-- 12/2024
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2024-12-01' and data < '2025-01-01' limit 500
);

-- 01/2025
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2025-01-01' and data < '2025-02-01' limit 500
);

-- 02/2025
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2025-02-01' and data < '2025-03-01' limit 500
);

-- 03/2025
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2025-03-01' and data < '2025-04-01' limit 500
);

-- 04/2025
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2025-04-01' and data < '2025-05-01' limit 500
);

-- 05/2025
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2025-05-01' and data < '2025-06-01' limit 500
);

-- 06/2025
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2025-06-01' and data < '2025-07-01' limit 500
);

-- 07/2025
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2025-07-01' and data < '2025-08-01' limit 500
);

-- 08/2025
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2025-08-01' and data < '2025-09-01' limit 500
);

-- 09/2025
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2025-09-01' and data < '2025-10-01' limit 500
);

-- 10/2025
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2025-10-01' and data < '2025-11-01' limit 500
);

-- 11/2025
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2025-11-01' and data < '2025-12-01' limit 500
);

-- 12/2025
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2025-12-01' and data < '2026-01-01' limit 500
);

-- 01/2026
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2026-01-01' and data < '2026-02-01' limit 500
);

-- 02/2026
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2026-02-01' and data < '2026-03-01' limit 500
);

-- 03/2026
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2026-03-01' and data < '2026-04-01' limit 500
);

-- 04/2026
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2026-04-01' and data < '2026-05-01' limit 500
);

-- 05/2026
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2026-05-01' and data < '2026-06-01' limit 500
);

-- 06/2026
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2026-06-01' and data < '2026-07-01' limit 500
);

-- 07/2026
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2026-07-01' and data < '2026-08-01' limit 500
);

-- 08/2026
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2026-08-01' and data < '2026-09-01' limit 500
);

-- 09/2026
delete from public.checklist_submissions where id in (
  select id from public.checklist_submissions
  where resumo->'legado'->>'origem' = 'Base POC 4.0' and data >= '2026-09-01' and data < '2026-10-01' limit 500
);

-- Repita cada bloco até retornar 'DELETE 0'.

-- ========== PASSO 2: conferir que não sobrou nada ==========
select count(*) as restantes from public.checklist_submissions where resumo->'legado'->>'origem' = 'Base POC 4.0';
-- deve retornar 0

-- ========== PASSO 3: colaboradores históricos e semanas ==========
delete from public.employees where funcao = 'Observador (histórico)' and ativo = false;
delete from public.semanas_config where (ano, mes) between (2024, 7) and (2026, 9);
