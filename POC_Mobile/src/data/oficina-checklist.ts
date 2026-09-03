import type { CategoriaGoman } from "./goman-checklist";

export const oficinaChecklist: CategoriaGoman[] = [
  {
    id: "padrinho_seguranca",
    label: "Padrinho de Segurança",
    perguntas: [
      { id: "ofi-001", texto: "Há sempre uma pessoa orientada a guiar os motoristas em manobras, ao entrar e sair da oficina?", peso: 1, gravidade: "Leve" },
    ],
  },
  {
    id: "epi_epc_ferramentas",
    label: "EPI, EPC e Ferramentas",
    perguntas: [
      { id: "ofi-002", texto: "Utilizou corretamente o EPI luvas, capacetes, óculos (quando indispensável para execução da atividade)?", peso: 5, gravidade: "Grave" },
      { id: "ofi-003", texto: "Os EPIs estão em bom estado de conservação?", peso: 3, gravidade: "Médio" },
      { id: "ofi-004", texto: "Estão sendo utilizadas as ferramentas adequadas para execução da atividade?", peso: 1, gravidade: "Leve" },
      { id: "ofi-005", texto: "Há extintor de incêndio na oficina? E este está devidamente posicionado e sinalizado?", peso: 3, gravidade: "Médio" },
      { id: "ofi-006", texto: "Há extintor de incêndio no posto interno? E este está devidamente posicionado e sinalizado?", peso: 5, gravidade: "Grave" },
    ],
  },
  {
    id: "procedimento",
    label: "Procedimento",
    perguntas: [
      { id: "ofi-007", texto: "Os resíduos foram devidamente separados, coletados e armazenados?", peso: 1, gravidade: "Leve" },
      { id: "ofi-008", texto: "O abastecimento é realizado somente por pessoas habilitadas e devidamente autorizadas?", peso: 3, gravidade: "Médio" },
      { id: "ofi-009", texto: "A inspeção de fuga de corrente elétrica nos elevadores hidráulicos estão sendo realizados periodicamente?", peso: 1, gravidade: "Leve" },
      { id: "ofi-010", texto: "A utilização de máquinas e equipamentos, como maquinas de soldas e lixadeiras são realizados por pessoas autorizadas?", peso: 5, gravidade: "Grave" },
      { id: "ofi-011", texto: "A área de trabalho está delimitada e isolada?", peso: 1, gravidade: "Leve" },
      { id: "ofi-012", texto: "Os veículos no elevador, foram devidamente patolados?", peso: 5, gravidade: "Grave" },
      { id: "ofi-013", texto: "Os local de trabalho está devidamente sinalizado?", peso: 1, gravidade: "Leve" },
      { id: "ofi-014", texto: "O separador de água e óleo do lavador está em funcionamento?", peso: 3, gravidade: "Médio" },
      { id: "ofi-015", texto: "O lavador tem guia de direção, está em perfeitas condições?", peso: 3, gravidade: "Médio" },
      { id: "ofi-016", texto: "As licenças do posto de combustível, estão em dia?", peso: 5, gravidade: "Grave" },
      { id: "ofi-017", texto: "Os produtos químicos utilizados na oficina possuem FISPQ?", peso: 3, gravidade: "Médio" },
      { id: "ofi-018", texto: "Os produtos que apresentam riscos a saúde e integridade física estão devidamente sinalizados?", peso: 5, gravidade: "Grave" },
    ],
  },
];

export const totalPerguntasOficina = oficinaChecklist.reduce(
  (sum, cat) => sum + cat.perguntas.length, 0
);
