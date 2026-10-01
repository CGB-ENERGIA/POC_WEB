# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vue 3 + Quasar Framework (PWA, offline-first) · Pinia · Supabase (auth, DB, Storage) · TypeScript · Vercel deploy

## Users

**Técnicos/observadores de segurança** — colaboradores da CGB Engenharia que atuam em campo (bases operacionais, alojamentos, oficinas, logística). Registram observações de conformidade e não conformidade usando checklists estruturados (GOMAN, GSTC, GERE, Administrativo, Alojamento, Logística, Oficina), capturam fotos como evidência e trabalham frequentemente com conectividade instável ou ausente.

**Supervisores e gestores** — acompanham indicadores de progresso, analisam registros enviados, aprovam ou reprovam checklists e monitoram o desempenho das equipes por base e período.

Ambos os perfis usam o mesmo app simultânea e continuamente, sem autenticação separada: a identificação é feita por matrícula.

## Product Purpose

Digitaliza e centraliza o programa de observações de segurança comportamental e técnica da CGB Engenharia, que antes era conduzido em papel e planilhas Excel. Permite que técnicos registrem conformidades, não conformidades com evidências fotográficas e feedbacks diretamente do celular, sincronizando com a nuvem quando há conexão. Sucesso é medido pelo cumprimento das metas de observações por semana/mês por colaborador e pela rastreabilidade das não conformidades até sua resolução.

## Positioning

Sistema offline-first — todos os checklists, fotos e observações são registrados localmente primeiro e sincronizados de forma transparente, garantindo operação contínua mesmo em áreas sem sinal, o que diferencia de soluções web convencionais que travam sem conexão.

## Operating Context

- Dispositivos: smartphones Android (maioria) e iOS; telas pequenas (360–414px); conexão instável ou ausente em campo
- Fluxo principal: identificação por matrícula → seleção de auditagem → preenchimento de checklist → captura de fotos com carimbo de data/hora/observador → envio ou "concluir mais tarde"
- Rascunhos (`em_andamento`) persistem no Supabase para sobreviver à limpeza de cache/localStorage
- Galeria de fotos separada, sincronizada com Supabase Storage (retenção 3 meses)
- Metas configuráveis por auditagem e período (semana/mês)

## Capabilities and Constraints

- Checklists: GOMAN, GSTC, GERE, Administrativo, Alojamento, Logística, Oficina, Genérico
- Fotos de evidência: compressão automática (MAX 1280px, JPEG 0.72), carimbo de data/hora/equipe, máximo 5 fotos adicionais por checklist
- Sync: localStorage → Supabase (`user_observations`, `checklist_submissions`, `checklist_responses`, `checklist_photos`); R2 como primário para fotos quando configurado
- Sem login por senha: identificação por matrícula do funcionário
- PWA instalável no celular; funciona offline com ServiceWorker
- Não há app nativo (não é iOS/Android nativo)

## Brand Commitments

Identidade visual atual é referência, não obrigação — o design pode evoluir. A identidade da CGB Engenharia (marca, nome) deve ser preservada. Paleta e tipografia podem ser melhoradas para qualidade de produção.

## Evidence on Hand

- Implementação completa rodando em https://poc-web-nine.vercel.app/mobile/
- Código-fonte em `C:\POC\POC_Mobile\src`
- Supabase backend configurado e em produção

## Product Principles

1. **Campo primeiro** — cada decisão de UX prioriza o técnico com conexão instável, tela pequena e mãos sujas.
2. **Zero perda de dado** — um registro iniciado nunca se perde: rascunho local, backup remoto, retry automático.
3. **Evidência rastreável** — cada não conformidade tem foto carimbada, observador identificado e caminho até resolução.
4. **Progresso visível** — técnico e gestor enxergam meta × realidade em segundos, sem relatórios intermediários.
5. **Confiança antes da beleza** — a interface deve transmitir solidez e clareza operacional; estética serve a isso, não ao contrário.

## Accessibility & Inclusion

Suporte obrigatório a Android 8+ (sem suporte a emojis complexos no canvas — já tratado); touch targets mínimos de 44px; texto legível sob luz solar direta.
