import type { CategoriaGoman } from "./goman-checklist";

export const logisticaChecklist: CategoriaGoman[] = [
  {
    id: "apr",
    label: "APR",
    perguntas: [
      { id: "log-001", texto: "A tarefa foi planejada de acordo com os procedimentos da empresa?", peso: 5, gravidade: "Grave" },
      { id: "log-002", texto: "Todos os colaboradores assinaram a APR?", peso: 5, gravidade: "Grave" },
    ],
  },
  {
    id: "padrinho_seguranca",
    label: "Padrinho de Segurança",
    perguntas: [
      { id: "log-003", texto: "Durante a movimentação das cargas, existe um colaborador orientando a equipe?", peso: 5, gravidade: "Grave" },
    ],
  },
  {
    id: "epi_epc_ferramentas",
    label: "EPI, EPC e Ferramentas",
    perguntas: [
      { id: "log-004", texto: "Todos os colaboradores estão fazendo uso dos EPIs (bota, capacete, óculos, cinta lombar, luva...)?", peso: 5, gravidade: "Grave" },
      { id: "log-005", texto: "Todos os colaboradores estão protegidos de quedas de cargas (fora do raio de movimentação dos materiais)?", peso: 5, gravidade: "Grave" },
      { id: "log-006", texto: "Cabos, cintas e estropos estão em perfeitas condições?", peso: 5, gravidade: "Grave" },
    ],
  },
  {
    id: "procedimento",
    label: "Procedimento",
    perguntas: [
      { id: "log-007", texto: "Na movimentação de carga, está sendo utilizada a corda para guiar os materiais (não é permitido guiar o material tocando diretamente nele)?", peso: 5, gravidade: "Grave" },
      { id: "log-008", texto: "O acesso à carroceria está sendo feito através de escada conforme procedimento?", peso: 3, gravidade: "Médio" },
      { id: "log-009", texto: "A área está devidamente sinalizada e isolada?", peso: 3, gravidade: "Médio" },
      { id: "log-010", texto: "Todas as pessoas estranhas ao serviço estão fora da área isolada?", peso: 3, gravidade: "Médio" },
      { id: "log-011", texto: "Somente pessoas autorizadas estão na carroceria durante a elevação da carga?", peso: 3, gravidade: "Médio" },
      { id: "log-012", texto: "O Risco de impacto contra objetos está controlado (movimentações de materiais com cintas)?", peso: 3, gravidade: "Médio" },
      { id: "log-013", texto: "O operador é autorizado para operar o equipamento (guindauto, empilhadeira,...)?", peso: 5, gravidade: "Grave" },
      { id: "log-014", texto: "Existe risco de toque acidental na rede elétrica?", peso: 3, gravidade: "Médio" },
      { id: "log-015", texto: "O acondicionamento do material no pátio está organizado e seguindo os padrões (identificação e empilhamento)?", peso: 3, gravidade: "Médio" },
    ],
  },
  {
    id: "veiculos_equipamentos",
    label: "Veículos e Equipamentos",
    perguntas: [
      { id: "log-016", texto: "O veículo está calçado, freado e sinalizado (estabilizado, sapatas abertas e niveladas)?", peso: 5, gravidade: "Grave" },
      { id: "log-017", texto: "O gancho e a trava dos equipamentos estão em condições de uso?", peso: 3, gravidade: "Médio" },
      { id: "log-018", texto: "A cabine e carroceria do caminhão estão limpas e organizadas?", peso: 1, gravidade: "Leve" },
      { id: "log-019", texto: "A capacidade de carga dos equipamentos está devidamente sinalizada e visível?", peso: 1, gravidade: "Leve" },
      { id: "log-020", texto: "A capacidade de elevação de carga da cinta e/ou pega poste é compatível com a carga a ser içada?", peso: 5, gravidade: "Grave" },
      { id: "log-021", texto: "O pino da trava de segurança das patola estão travados?", peso: 5, gravidade: "Grave" },
      { id: "log-022", texto: "A quantidade de materiais previstos na carga permite que os materiais fiquem armazenados na carroceria do caminhão de maneira segura durante o trajeto e a descarga?", peso: 3, gravidade: "Médio" },
      { id: "log-023", texto: "A documentação do veículo/equipamento (CRLV, ART, manual de operação) está correta?", peso: 1, gravidade: "Leve" },
      { id: "log-024", texto: "A documentação do veículo/equipamento (laudos acústicos e dielétricos) está correta?", peso: 5, gravidade: "Grave" },
      { id: "log-025", texto: "O checklist veicular foi preenchido corretamente?", peso: 3, gravidade: "Médio" },
      { id: "log-026", texto: "As partes hidráulicas estão com vazamento?", peso: 5, gravidade: "Grave" },
      { id: "log-027", texto: "Itens de segurança veicular estão em condições de uso? (freio, pneu, iluminação, cinto de segurança)", peso: 5, gravidade: "Grave" },
    ],
  },
];

export const totalPerguntasLogistica = logisticaChecklist.reduce(
  (sum, cat) => sum + cat.perguntas.length, 0
);
