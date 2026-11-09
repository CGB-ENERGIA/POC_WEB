-- Desfaz a troca de coordenadores Marcos / Jackson.
-- Fica: Jackson = SPOT BDC (MA-BDC-O001M a O007M) e Marcos = SPOT STI (MA-STI-O005M a O012M).
-- Os BDC já estão com Jackson; aqui voltam para o Marcos as equipes STI e os observadores STI.
-- Idempotente (pode rodar mais de uma vez). O histórico (equipes_coordenacao_historico) já está correto.

-- 1) Equipes SPOT STI -> Marcos (gerência SPOT e gerente continuam como estão)
UPDATE public.pwa_equipes
   SET coordenador = 'Marcos'
 WHERE prefixo IN (
   'MA-STI-O005M','MA-STI-O006M','MA-STI-O007M','MA-STI-O008M',
   'MA-STI-O009M','MA-STI-O010M','MA-STI-O011M','MA-STI-O012M'
 )
   AND coordenador IS DISTINCT FROM 'Marcos';

-- 2) Observadores da base STI que estão com Jackson -> Marcos
--    (inclui o próprio Marcos F. 15455; os da BDC e a matrícula duplicada '120' não são tocados)
UPDATE public.employees
   SET coordenador = 'Marcos'
 WHERE matricula IN ('00120','12534','12650','12742','13077','13080','15455','16939','17746','24036')
   AND coordenador ILIKE 'jackson';
