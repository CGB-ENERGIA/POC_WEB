export interface ChecklistCategory {
  id: string;
  label: string;
  icon: string;
  items: string[];
}

export const categorias: ChecklistCategory[] = [
  {
    id: "republicas",
    label: "Repúblicas",
    icon: "mdi-home-outline",
    items: [
      "Limpeza e organização",
      "Instalações elétricas",
      "Hidráulica / vazamentos",
      "Iluminação",
      "Estrutura / pintura",
      "Outro",
    ],
  },
  {
    id: "procedimentos",
    label: "Procedimentos",
    icon: "mdi-clipboard-check-outline",
    items: [
      "POP não cumprido",
      "Autorização de trabalho",
      "Padrinho de segurança",
      "Análise de risco",
      "Permissão / liberação",
      "Outro",
    ],
  },
  {
    id: "epi",
    label: "EPI, EPC e Ferramentas",
    icon: "mdi-hard-hat",
    items: [
      "EPI ausente ou inadequado",
      "EPC danificado",
      "Ferramenta danificada",
      "Escada / plataforma",
      "Veículo / equipamento",
      "Outro",
    ],
  },
  {
    id: "veiculos",
    label: "Veículos e Equipamentos",
    icon: "mdi-truck-outline",
    items: [
      "Placa / identificação",
      "Luzes / sinalização",
      "Manutenção pendente",
      "Documentação",
      "Condições de uso",
      "Outro",
    ],
  },
];

export const basesOperacionais = [
  "LDP", "GTC", "MRA", "STI", "BCB", "PDS", "PDT", "BDC", "ITM", "SEDE",
];

export const tiposObservacao = [
  { value: "conforme", label: "Conforme", color: "positive", icon: "mdi-check-circle" },
  { value: "inconforme", label: "Inconforme", color: "negative", icon: "mdi-alert-circle" },
  { value: "feedback", label: "Feedback", color: "warning", icon: "mdi-message-alert" },
];

export const severidades = ["Baixa", "Média", "Alta", "Crítica"];
