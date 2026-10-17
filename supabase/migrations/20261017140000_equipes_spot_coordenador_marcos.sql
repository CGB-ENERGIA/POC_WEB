-- Todas as equipes SPOT pertencem ao coordenador Marcos. MA-STI-O005M, O006M e O007M estavam cadastradas
-- com o gerente (Jamerson) no campo de coordenador; o gerente delas continua sendo o Jamerson.
update public.pwa_equipes
   set coordenador = 'Marcos', updated_at = now()
 where upper(btrim(gerencia)) = 'SPOT'
   and lower(btrim(coordenador)) <> 'marcos';

update public.equipes_coordenacao_historico
   set coordenador = 'Marcos', updated_at = now()
 where upper(btrim(gerencia)) = 'SPOT'
   and lower(btrim(coordenador)) <> 'marcos';
