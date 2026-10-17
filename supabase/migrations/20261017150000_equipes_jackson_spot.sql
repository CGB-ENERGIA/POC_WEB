-- As equipes coordenadas pelo Jackson (MA-BDC-O001M a O007M) também são da gerência SPOT, não GOMAN.
-- O gerente delas (Cesar) não muda. No PWA, o checklist GOMAN lista equipes GOMAN e SPOT: nada some para os observadores.
update public.pwa_equipes
   set gerencia = 'SPOT', updated_at = now()
 where lower(btrim(coordenador)) = 'jackson'
   and upper(btrim(gerencia)) <> 'SPOT';

update public.equipes_coordenacao_historico
   set gerencia = 'SPOT', updated_at = now()
 where lower(btrim(coordenador)) = 'jackson'
   and coalesce(upper(btrim(gerencia)), '') <> 'SPOT';
