import type { CategoriaGoman } from "./goman-checklist";

export const administrativoChecklist: CategoriaGoman[] = [
  {
    id: "epi_epc_ferramentas",
    label: "EPI, EPC e Ferramentas",
    perguntas: [
      { id: "adm-001", texto: "O colaborador está utilizando o EPI adequado para a atividade que está realizando?", peso: 5, gravidade: "Grave" },
      { id: "adm-002", texto: "O colaborador está utilizando o EPI de forma correta?", peso: 5, gravidade: "Grave" },
      { id: "adm-003", texto: "O EPI Óculos de lente incolor está em boas condições de uso?", peso: 3, gravidade: "Médio" },
      { id: "adm-004", texto: "O EPI Luva LATEX está em boas condições de uso?", peso: 3, gravidade: "Médio" },
      { id: "adm-005", texto: "O EPI Botina está em boas condições de uso?", peso: 3, gravidade: "Médio" },
    ],
  },
  {
    id: "procedimento",
    label: "Procedimento",
    perguntas: [
      { id: "adm-006", texto: "Os colaboradores estão sentados de forma adequada?", peso: 3, gravidade: "Médio" },
      { id: "adm-007", texto: "Os colaboradores obedecem as sinalizações das áreas do prédio?", peso: 5, gravidade: "Grave" },
      { id: "adm-008", texto: "Os colaboradores estão portando o crachá de identificação?", peso: 5, gravidade: "Grave" },
      { id: "adm-009", texto: "As colaboradoras estão utilizando sapatos fechados sem salto?", peso: 3, gravidade: "Médio" },
    ],
  },
  {
    id: "estruturas_instalacoes",
    label: "Estruturas e Instalações Prediais",
    perguntas: [
      { id: "adm-010", texto: "Os ambientes possuem ventilação e iluminação adequadas?", peso: 5, gravidade: "Grave" },
      { id: "adm-011", texto: "Nos sanitários há lavatório, mictório 0,50m do piso e vaso sanitário, com descarga, na proporção de 1 para 20 trabalhadores e chuveiro na proporção de 1 para 10 trabalhadores?", peso: 1, gravidade: "Leve" },
      { id: "adm-012", texto: "Onde não houver serviço de esgoto, há uso de fossa adequada?", peso: 1, gravidade: "Leve" },
      { id: "adm-013", texto: "Todos os cômodos do escritório são providos de rede de iluminação, cuja fiação seja protegida por eletrodutos/canaletas nas paredes?", peso: 5, gravidade: "Grave" },
      { id: "adm-014", texto: "Nos sanitários há portas com trinco de acesso que impeçam o devassamento?", peso: 1, gravidade: "Leve" },
      { id: "adm-015", texto: "As paredes dos sanitários são de material resistente e lavável e os pisos são impermeáveis?", peso: 3, gravidade: "Médio" },
      { id: "adm-016", texto: "Os gabinetes sanitários são ventilados para o exterior ou possuem exaustor?", peso: 3, gravidade: "Médio" },
      { id: "adm-017", texto: "Água potável fornecida aos trabalhadores em condições higiênicas, por meio de copos individuais ou bebedouros de jato inclinado?", peso: 5, gravidade: "Grave" },
      { id: "adm-018", texto: "Na copa há equipamento de refrigeração, pia para lavar os alimentos e utensílios e recipiente com tampa para coleta de lixo?", peso: 5, gravidade: "Grave" },
      { id: "adm-019", texto: "Quando utilizado GLP, os botijões ficam instalados fora do ambiente de utilização, em área permanentemente ventilada e coberta?", peso: 5, gravidade: "Grave" },
      { id: "adm-020", texto: "As paredes e tetos e/ou forros da edificação estão em bom estado de conservação (pintura, reboco, sinais de infiltração)?", peso: 5, gravidade: "Grave" },
      { id: "adm-021", texto: "Há sinais de presença de insetos o/ou pragas (pombos, morcegos, ratos, entre outros) nas instalações prediais?", peso: 5, gravidade: "Grave" },
      { id: "adm-022", texto: "Os extintores estão adequadamente instalado, dentro da validade e devidamente sinalizado?", peso: 5, gravidade: "Grave" },
      { id: "adm-023", texto: "As cadeiras estão em condições de uso?", peso: 5, gravidade: "Grave" },
      { id: "adm-024", texto: "As baias estão em condições de uso?", peso: 3, gravidade: "Médio" },
      { id: "adm-025", texto: "Os ambientes no escritório estão limpos e organizados?", peso: 5, gravidade: "Grave" },
      { id: "adm-026", texto: "Há material de limpeza ou enxugo das mãos nos lavatórios da empresa, proibido toalhas coletivas?", peso: 3, gravidade: "Médio" },
      { id: "adm-027", texto: "Há risco de queda de mesmo nível, desnivelamento do piso?", peso: 5, gravidade: "Grave" },
    ],
  },
];

export const totalPerguntasAdministrativo = administrativoChecklist.reduce(
  (sum, cat) => sum + cat.perguntas.length, 0
);
