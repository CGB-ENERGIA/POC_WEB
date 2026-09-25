---
target: src/pages/HomePage.vue
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:C:\\POC\\POC_Mobile\\src\\pages\\HomePage.vue"
target_fingerprint: "sha256:revised-f1619d3"
target_path: "C:\\POC\\POC_Mobile\\src\\pages\\HomePage.vue"
timestamp: 2026-09-25T13-30-00Z
slug: src-pages-homepage-vue
---
# Critique: src/pages/HomePage.vue

Method: dual-agent (A: Design Review · B: Detector + Browser)
Revision: post-harden+layout+quieter+polish (commit f1619d3)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | ✅ Badge offline + ponto pulsante no anel + toast de erro |
| 2 | Match System / Real World | 3 | Siglas GOMAN/GSTC/GERE sem legenda; subtítulo câmera corrigido |
| 3 | User Control and Freedom | 2 | Sem cancelar rascunho direto na home; logout sem confirmação visível |
| 4 | Consistency and Standards | 3 | ✅ Dois sistemas de estilo unificados; cores hardcoded permanecem (sem tokens) |
| 5 | Error Prevention | 3 | ✅ metaProgress NaN corrigido; câmera ainda dispara com tap único |
| 6 | Recognition Rather Than Recall | 4 | ✅ Card acesso rápido resolve visibilidade do rascunho; contraste corrigido (#64748b) |
| 7 | Flexibility and Efficiency | 4 | ✅ Acesso rápido: 1 tap para GOMAN; home ainda idêntica para técnico/gestor |
| 8 | Aesthetic and Minimalist Design | 4 | ✅ hp-item__dot removido; hp-section-label removido; câmera em branco |
| 9 | Error Recovery | 4 | ✅ Badge offline + toast quando fetchSynced falha |
| 10 | Help and Documentation | 2 | Estado vazio sem mensagem; origem das metas não explicada |
| **Total** | | **33/40** | **Good** |

## Design Specificity Verdict

Interface evoluiu de Acceptable (23/40) para Good (33/40) nesta revisão. As lacunas de
estado offline/erro foram completamente endereçadas — crítico para uso em campo. O card de
acesso rápido elimina os 3 taps desnecessários antes do trabalho real. Camera card
hierarquicamente correto: gradiente crimson exclusivo do banner. Contraste de labels passa
WCAG AA. Violação de craft-floor (border-left 4px) em app.scss removida.

Detector: 1 finding restante: Roboto (overused font, app.scss:5) — pendente para /impeccable typeset.
Browser: não acessível (porta 9100 inativa; porta 3000 pertence a outro app).

## Backlog Restante

### [P2] Ausência de design tokens — cores hardcoded duplicadas
`#7a1225`, `#8b1b30`, `#0f172a`, `#1e293b` repetidos em múltiplos arquivos. Fix: CSS custom
properties em `:root`. Endereçar em `/impeccable extract`.

### [P2] Tipografia genérica — Roboto
Roboto é overused font sem caráter próprio para o produto. Fix: `/impeccable typeset`.

### [P3] Home idêntica para técnico e gestor
Supervisores sem visão de equipe. Fix: role-aware section ou tab em versão futura.

### [P3] Siglas GOMAN/GSTC/GERE sem legenda
Novo colaborador não entende o que são. Fix: tooltip ou legenda curta nos cards.

### [P3] Estado vazio sem mensagem orientativa
Quando total = 0, nenhuma instrução sobre o que fazer. Fix: empty state com copy.

## Minor Observations (pendentes)
- semanaDoMes usa limites fixos não alinhados com semanas ISO
- Câmera ainda dispara com tap único (sem confirmação)
- Gradientes dos grupos quase idênticos sob luz solar
- Dark mode usa `:global(body.body--dark)` frágil (sem tokens CSS)
