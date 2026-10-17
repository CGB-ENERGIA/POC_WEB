-- As equipes coordenadas pelo Marcos (MA-STI-O008M a O012M) são da gerência SPOT, não GOMAN.
-- No PWA, o checklist GOMAN lista equipes GOMAN e SPOT, então a mudança não esconde essas equipes dos observadores.
update public.pwa_equipes
   set gerencia = 'SPOT', updated_at = now()
 where lower(btrim(coordenador)) = 'marcos'
   and upper(btrim(gerencia)) <> 'SPOT';

update public.equipes_coordenacao_historico
   set gerencia = 'SPOT', updated_at = now()
 where lower(btrim(coordenador)) = 'marcos'
   and coalesce(upper(btrim(gerencia)), '') <> 'SPOT';
