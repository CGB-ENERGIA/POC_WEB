---
target: src/pages/ChecklistGomanPage.vue
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\POC\\POC_Mobile\\src\\pages\\ChecklistGomanPage.vue"
target_fingerprint: "sha256:goman-initial"
target_path: "C:\\POC\\POC_Mobile\\src\\pages\\ChecklistGomanPage.vue"
timestamp: 2026-09-25T14-00-00Z
slug: src-pages-checklistgomanpage-vue
---
# Critique: src/pages/ChecklistGomanPage.vue

Method: Assessment A (Design Review) — Browser indisponível (dev server offline)
Revision: post-P1-fixes (toggle conforme + loading foto + 2 membros padrão)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | ✅ Loading indicator durante stampAuditPhoto adicionado |
| 2 | Match System / Real World | 3 | Labels claros; "Peso X" sem contexto nos cards de pergunta |
| 3 | User Control and Freedom | 3 | ✅ Toggle conforme corrigido (2º tap desfaz resposta) |
| 4 | Consistency and Standards | 3 | Quasar usado consistentemente; resposta-btn--idle bem implementado |
| 5 | Error Prevention | 3 | Validação completa antes de confirmar NC; sem confirm em "Concluir mais tarde" |
| 6 | Recognition Rather Than Recall | 3 | Progress por categoria visível; pergunta-card--focus destaca próxima |
| 7 | Flexibility and Efficiency | 3 | Auto-scroll para próxima pergunta; autocomplete de membros; galeria de fotos |
| 8 | Aesthetic and Minimalist Design | 2 | Modal NC com 5 campos obrigatórios em bottom sheet — denso para campo |
| 9 | Error Recovery | 3 | ServerTimeError com mensagem específica; retry manual |
| 10 | Help and Documentation | 3 | Labels de campo claros; mensagens de erro específicas |
| **Total** | | **29/40** | **Acceptable** |

## Design Specificity Verdict

Página funcional e bem estruturada para o fluxo de checklist. O auto-scroll para a próxima
pergunta após resposta é uma micro-interação excelente. Maior risco para campo: modal de não
conformidade concentra muita decisão em uma tela (5 campos + lista de itens), aumentando a
chance de abandono ou erro em condições adversas (chuva, luva, luz solar).

## Priority Issues

### [P1] Modal NC denso — múltiplos campos obrigatórios numa bottom sheet
Foto + observação + itens + atribuição + resolvido em um único fluxo. Fix: mostrar campo de
foto e observação primeiro; expandir atribuição e resolvido apenas após foto confirmada
(lazy disclosure). Ou reduzir a 2 campos obrigatórios (foto + observação) e deixar os demais
opcionais com padrão "equipe" e "não resolvido".

### [P2] Sem confirmação antes de "Concluir mais tarde"
Tap acidental em "Concluir mais tarde" salva rascunho em_andamento sem aviso. Fix: dialog de
confirmação de 2 opções ("Sim, salvar" / "Continuar preenchendo").

### [P2] "Peso X" nos cards de pergunta sem contexto
Campo workers não sabem o que significa "Peso 1/2/3". Fix: remover do card de pergunta ou
substituir por indicador visual de prioridade (apenas gravidade).

### [P2] 4→2 membros padrão (✅ corrigido — 2 membros default)

### [P3] Sem indicação de progresso salvo como rascunho
`persistDraft` salva automaticamente mas nenhum feedback visual confirma o save.

## Backlog Restante

- Modal NC: lazy disclosure (P1)
- Confirmação em "Concluir mais tarde" (P2)
- Badge "Peso" nos cards de pergunta (P2)
- Indicador visual de autosave do rascunho (P3)
- Retry automático quando ServerTimeError (P3)
