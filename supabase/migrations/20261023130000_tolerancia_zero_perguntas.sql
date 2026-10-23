-- Perguntas de Tolerância Zero (planilha "PERGUNTAS - TOLERÂNCIA ZERO"): é a lista que define o que conta como tolerância zero
-- nas páginas Tolerância Zero e ICIT e no alerta do Dashboard. Antes valia "gravidade Grave / peso 5", que não era a lista oficial.
-- chave = texto da pergunta só com letras e números, minúsculo e sem acento (o painel compara por ela, então variações de espaço e pontuação casam).
-- As etapas das Regras de Ouro (Desligar, Bloquear, Sinalizar, Testar, Aterrar, Proteger) são contadas item a item.
-- Para mudar a lista: inserir, editar ou desativar (ativo = false) linhas aqui; não precisa mexer no código.
create table if not exists public.tolerancia_zero_perguntas (
  chave text primary key,
  pergunta text not null,
  categoria text not null,
  ativo boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.tolerancia_zero_perguntas enable row level security;

drop policy if exists tolerancia_zero_perguntas_select on public.tolerancia_zero_perguntas;
create policy tolerancia_zero_perguntas_select on public.tolerancia_zero_perguntas for select to anon, authenticated using (true);
drop policy if exists tolerancia_zero_perguntas_insert on public.tolerancia_zero_perguntas;
create policy tolerancia_zero_perguntas_insert on public.tolerancia_zero_perguntas for insert to authenticated with check (true);
drop policy if exists tolerancia_zero_perguntas_update on public.tolerancia_zero_perguntas;
create policy tolerancia_zero_perguntas_update on public.tolerancia_zero_perguntas for update to authenticated using (true) with check (true);

insert into public.tolerancia_zero_perguntas (chave, pergunta, categoria) values
  ('foipreenchidoosriscosdechoqueeletrico', 'Foi preenchido os riscos de choque elétrico?', 'APR'),
  ('foipreenchidoosriscosdequeda', 'Foi preenchido os riscos de queda?', 'APR'),
  ('foipreenchidoosriscosrelacionadosaepiepceferramentas', 'Foi preenchido os riscos relacionados a EPI, EPC e ferramentas?', 'APR'),
  ('foipreenchidoosriscosdetrabalhocomlinhavivamteat', 'Foi preenchido os riscos de trabalho com Linha Viva (MT e AT)?', 'APR'),
  ('foipreenchidoasmedidasdecontroleparatodososriscosidentificadosnaapr', 'Foi preenchido as medidas de controle para todos os riscos identificados na APR?', 'APR'),
  ('foipreenchidoonomedetodososcolaboradoreseassinada', 'Foi preenchido o nome de todos os colaboradores e assinada?', 'APR'),
  ('foianalisadoapossibilidadedaexistenciadoriscodeacidentedetransitoduranteexecucaodaatividadeseexistirforamadotadasasmedidasdecontrole', 'Foi analisado a possibilidade da existência do risco de Acidente de Trânsito durante execução da atividade? Se existir, foram adotadas as medidas de controle?', 'APR'),
  ('foramanalisadososriscosdetrabalhoemalturaquantoaquedademateriaisseexistirforamadotadasasmedidasdecontrole', 'Foram analisados os Riscos de Trabalho em Altura quanto a queda de materiais? Se existir, foram adotadas as medidas de controle?', 'APR'),
  ('foramanalisadososriscosdetrabalhoemalturaquantoascondicoesdaestruturadeapoiodaescadaseexistirforamadotadasasmedidasdecontrole', 'Foram analisados os Riscos de Trabalho em Altura quanto as condições da estrutura de apoio da escada? Se existir, foram adotadas as medidas de controle?', 'APR'),
  ('foramanalisadososriscosdetrabalhoemalturaquantoaoriscodequedadealturaseexistirforamadotadasasmedidasdecontrole', 'Foram analisados os Riscos de Trabalho em Altura quanto ao risco de queda de altura? Se existir, foram adotadas as medidas de controle?', 'APR'),
  ('foramanalisadososriscosdetrabalhoemalturaquantoaestruturadoposteseexistirforamadotadasasmedidasdecontrole', 'Foram analisados os Riscos de Trabalho em Altura quanto a estrutura do poste? Se existir, foram adotadas as medidas de controle?', 'APR'),
  ('sobreoriscodechoqueearcoeletricofoianalisadoseaatividadeserarealizadacomequipamentoeouredeenergizadaexisteriscodechoqueeletricoseexistirforamadotadasasmedidasdecontrole', 'Sobre o Risco de Choque e Arco Elétrico foi analisado se a atividade será realizada com equipamento e/ou rede energizada? Existe risco de choque elétrico? Se existir, foram adotadas as medidas de controle?', 'APR'),
  ('sobreoriscodechoqueearcoeletricofoianalisadosehaoriscodecontatoeouproximidadeacidentalcompartesenergizadasseexistirforamadotadasasmedidasdecontrole', 'Sobre o Risco de Choque e Arco Elétrico, foi analisado se há o risco de contato e/ou proximidade acidental com partes energizadas? Se existir, foram adotadas as medidas de controle?', 'APR'),
  ('sobreoriscodechoqueearcoeletricofoianalisadoseexisteoriscodecurtocircuitoeouarcoeletricoseexistirforamadotadasasmedidasdecontrole', 'Sobre o Risco de Choque e Arco Elétrico, foi analisado se existe o risco de curto-circuito e/ou arco elétrico? Se existir, foram adotadas as medidas de controle?', 'APR'),
  ('sobreoriscodechoqueearcoeletricofoianalisadoseotrabalhoserarealizadocomrededesenergizadaesehariscodeenergizacaoacidentalseexistirforamadotadasasmedidasdecontrole', 'Sobre o Risco de Choque e Arco Elétrico, foi analisado se o trabalho será realizado com rede desenergizada e se há risco de energização acidental? Se existir, foram adotadas as medidas de controle?', 'APR'),
  ('sobreoutrosriscosdaatividadefoianalisadaseosenvolvidosestaoemcondicoesfisicaepsicologicapararealizacaodatarefa', 'Sobre Outros Riscos da atividade, foi analisada se os envolvidos estão em condições (física e psicológica) para realização da tarefa?', 'APR'),
  ('sobreoutrosriscosdaatividadefoiidentificadooresponsavelpelaconstatacaodaausenciadetensaoeouaterramentotemporario', 'Sobre Outros Riscos da atividade, foi identificado o responsável pela constatação da ausência de tensão e/ou aterramento temporário?', 'APR'),
  ('osepisparatrabalhoemalturacintotalabartetravaquedaslinhadevidaetcestaoemcondicoesdeuso', 'Os EPIs para Trabalho em Altura (Cinto, Talabarte, Trava quedas, Linha de vida, etc) estão em condições de uso ?', 'APR'),
  ('opadrinhodesegurancaestasupervisionandoaexecucaodaatividade', 'O Padrinho de Segurança está supervisionando a execução da atividade?', 'Padrinho de Segurança'),
  ('opadrinhodesegurancasecomunicaeorientaaexecucaodaatividade', 'O Padrinho de Segurança se comunica e orienta a execução da atividade?', 'Padrinho de Segurança'),
  ('opadrinhodesegurancainterviuparaevitardesvios', 'O Padrinho de Segurança interviu para evitar desvios?', 'Padrinho de Segurança'),
  ('colaboradorduranteescaladaposicionouotravaquedascomfatordequedazeroacimadoniveldopeito', 'Colaborador durante escalada posicionou o Trava quedas com fator de queda zero(acima do nível do peito) ?', 'Padrinho de Segurança'),
  ('utilizouosepivestimentacapacetedesegurancacomjugularluvasisolantesmangasisolantesetccorretamente', 'Utilizou os EPI (Vestimenta, capacete de segurança com jugular, luvas isolantes, mangas isolantes etc.) corretamente?', 'Procedimento'),
  ('utilizouosepcdetectordeausenciadetensaomantasisolanteslencoisisolantesvarademanobraetccorretamente', 'Utilizou os EPC (detector de ausência de tensão, mantas isolantes, lençóis isolantes, vara de manobra etc.) corretamente?', 'Procedimento'),
  ('cumpriuaetapadaregradeourodesligar', 'Cumpriu a etapa da Regra de Ouro: DESLIGAR?', 'Regras de Ouro'),
  ('cumpriuaetapadaregradeourobloquear', 'Cumpriu a etapa da Regra de Ouro: BLOQUEAR?', 'Regras de Ouro'),
  ('cumpriuaetapadaregradeourosinalizar', 'Cumpriu a etapa da Regra de Ouro: SINALIZAR?', 'Regras de Ouro'),
  ('cumpriuaetapadaregradeourotestar', 'Cumpriu a etapa da Regra de Ouro: TESTAR?', 'Regras de Ouro'),
  ('cumpriuaetapadaregradeouroaterrar', 'Cumpriu a etapa da Regra de Ouro: ATERRAR?', 'Regras de Ouro'),
  ('cumpriuaetapadaregradeouroproteger', 'Cumpriu a etapa da Regra de Ouro: PROTEGER?', 'Regras de Ouro'),
  ('foiseccionadoodisjuntorefezotestedepresencadetensao', 'Foi seccionado o disjuntor e fez o teste de presença de tensão?', 'Regras de Ouro'),
  ('nasubstituicaodemedidorestrifasicosfoirealizadoadesconexaodoramaldeligacaodoclientenaredebt', 'Na substituição de medidores trifásicos foi realizado a desconexão do ramal de ligação do cliente na rede BT?', 'Regras de Ouro'),
  ('utilizouosepivestimentacapacetedesegurancacomjugularluvasisolantesmangasisolantesprotetorfacialetccorretamente', 'Utilizou os EPI (Vestimenta, capacete de segurança com jugular, luvas isolantes, mangas isolantes, protetor facial etc.) corretamente?', 'Regras de Ouro'),
  ('utilizouosepcdetectordeausenciadetensaomantasisolantestapeteisolantevarademanobraetccorretamente', 'Utilizou os EPC (detector de ausência de tensão, mantas isolantes, tapete isolante, vara de manobra etc.) corretamente?', 'Regras de Ouro'),
  ('fezaamarracaocorretadaescadanocentroetopo', 'Fez a amarração correta da escada no centro e topo?', 'Trabalho em Altura'),
  ('utilizoubaldedelonaparaicamentodemateriaiseferramentas', 'Utilizou balde de lona para içamento de materiais e ferramentas?', 'Trabalho em Altura'),
  ('utilizoucorretamenteocintodesegurancatalabarteetravaquedasemtrabalhoemaltura', 'Utilizou corretamente o cinto de segurança, talabarte e trava quedas em trabalho em altura?', 'Trabalho em Altura')
on conflict (chave) do update set pergunta = excluded.pergunta, categoria = excluded.categoria, ativo = true, updated_at = now();
