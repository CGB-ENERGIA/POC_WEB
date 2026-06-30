export type Gravidade = "Leve" | "Médio" | "Grave"
export type RespostaChecklist = "conforme" | "nao_conforme" | null

export interface PerguntaGoman {
  id: string
  texto: string
  peso: number
  gravidade: Gravidade
}

export interface CategoriaGoman {
  id: string
  label: string
  perguntas: PerguntaGoman[]
}

export interface RespostaPergunta {
  perguntaId: string
  resposta: Exclude<RespostaChecklist, null>
  observacao?: string
  foto?: string
}

export const gomanChecklist: CategoriaGoman[] = [
  {
    "id": "apr",
    "label": "APR",
    "perguntas": [
      {
        "id": "goman-001",
        "texto": "Foi preenchido os riscos de choque elétrico?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-002",
        "texto": "Foi preenchido os riscos de queda?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-003",
        "texto": "Foi preenchido os riscos relacionados a EPI, EPC e ferramentas?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-004",
        "texto": "Foi preenchido os riscos de deslocamento de veículos e movimentação de cargas?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-005",
        "texto": "Foi preenchido o risco ergonômico?",
        "peso": 1,
        "gravidade": "Leve"
      },
      {
        "id": "goman-006",
        "texto": "Foi preenchido os riscos de trabalho com Linha Viva (MT e AT)?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-007",
        "texto": "Foi preenchido os riscos de operação com equipamentos e ferramentas?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-008",
        "texto": "Foi preenchido as medidas de controle para todos os riscos identificados na APR?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-009",
        "texto": "Foi preenchido o nome do Padrinho de Segurança?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-010",
        "texto": "Existia risco para Recusa da atividade? Foi apresentado as evidências do risco da atividade?",
        "peso": 1,
        "gravidade": "Leve"
      },
      {
        "id": "goman-011",
        "texto": "Foi preenchido o nome de todos os colaboradores e assinada?",
        "peso": 1,
        "gravidade": "Leve"
      }
    ]
  },
  {
    "id": "regras-de-ouro",
    "label": "REGRAS DE OURO",
    "perguntas": [
      {
        "id": "goman-012",
        "texto": "Cumpriu a etapa da Regra de Ouro: DESLIGAR?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-013",
        "texto": "Cumpriu a etapa da Regra de Ouro: BLOQUEAR?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-014",
        "texto": "Cumpriu a etapa da Regra de Ouro: SINALIZAR?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-015",
        "texto": "Cumpriu a etapa da Regra de Ouro: TESTAR?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-016",
        "texto": "Cumpriu a etapa da Regra de Ouro: ATERRAR?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-017",
        "texto": "Cumpriu a etapa da Regra de Ouro: PROTEGER?",
        "peso": 5,
        "gravidade": "Grave"
      }
    ]
  },
  {
    "id": "padrinho-de-seguran-a",
    "label": "PADRINHO DE SEGURANÇA",
    "perguntas": [
      {
        "id": "goman-018",
        "texto": "O Padrinho de Segurança está supervisionando a execução da atividade?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-019",
        "texto": "O Padrinho de Segurança se comunica e orienta a execução da atividade?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-020",
        "texto": "O Padrinho de Segurança interviu para evitar desvios?",
        "peso": 5,
        "gravidade": "Grave"
      }
    ]
  },
  {
    "id": "epi-epc-e-ferramentas",
    "label": "EPI, EPC e FERRAMENTAS",
    "perguntas": [
      {
        "id": "goman-021",
        "texto": "O EPI luvas isolante está em condições de uso? Está em vigência o teste dielétrico?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-022",
        "texto": "O EPI manga isolante está em condições de uso? Está em vigência o teste dielétrico?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-023",
        "texto": "Os EPI (capacete, vestimenta, bota de segurança, etc.) estão em condições de uso?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-024",
        "texto": "O EPC mantas isolantes estão em condições de uso? Está em vigência o teste dielétrico?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-025",
        "texto": "O EPC lençóis isolantes estão em condições de uso? Está em vigência o teste dielétrico?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-026",
        "texto": "O EPC coberturas isolantes estão em condições de uso? Está em vigência o teste dielétrico?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-027",
        "texto": "O EPC banqueta isolante está em condições de uso? Está em vigência o teste dielétrico?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-028",
        "texto": "O EPC vara de manobra está em condições de uso? Está em vigência o teste dielétrico?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-029",
        "texto": "O EPC bastão GLV está em condições de uso? Está em vigência o teste dielétrico?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-030",
        "texto": "Os EPC (cones, fita de sinalização, etc.) estão em condições de uso?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-031",
        "texto": "O EPC escadas está em condições de uso?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-032",
        "texto": "As Ferramentas (ferramenta AMPACT, chaves, alicates, etc.) estão em condições de uso?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-033",
        "texto": "As Ferramentas (detector de tensão, detector de ausência de tensão) estão em condições de uso?",
        "peso": 5,
        "gravidade": "Grave"
      }
    ]
  },
  {
    "id": "procedimento",
    "label": "PROCEDIMENTO",
    "perguntas": [
      {
        "id": "goman-034",
        "texto": "Cumpriu o procedimento de movimentação de carga (corda guia, transitar embaixo da carga, etc.)?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-035",
        "texto": "Foi utilizado o cavalete para apoio do poste de concreto?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-036",
        "texto": "A equipe possui os Procedimentos Operacionais Padrão das suas atividades?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-037",
        "texto": "A área de trabalho está sinalizada e delimitada com cones e fitas de sinalização, e demarcação da rota de fuga?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-038",
        "texto": "O veículo está estacionado corretamente?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-039",
        "texto": "Utilizou adornos durante a execução da atividade?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-040",
        "texto": "Fez o teste de ausência de tensão em fibras óticas, luminárias e fiações de IP?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-041",
        "texto": "Utilizou os EPI (Vestimenta, capacete de segurança com jugular, luvas isolantes, mangas isolantes etc.) corretamente?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-042",
        "texto": "Utilizou os EPC (detector de ausência de tensão, mantas isolantes, lençóis isolantes, vara de manobra etc.) corretamente?",
        "peso": 5,
        "gravidade": "Grave"
      }
    ]
  },
  {
    "id": "ve-culos-e-equipamentos",
    "label": "VEÍCULOS E EQUIPAMENTOS",
    "perguntas": [
      {
        "id": "goman-043",
        "texto": "A documentação do veículo/equipamento (CRLV, ART, manual de operação) está correta?",
        "peso": 1,
        "gravidade": "Leve"
      },
      {
        "id": "goman-044",
        "texto": "A documentação do veículo/equipamento ( laudos acústicos e dielétricos) está correta?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-045",
        "texto": "O checklist veicular foi preenchido corretamente?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-046",
        "texto": "As partes hidráulicas estão com vazamento?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-047",
        "texto": "Itens de segurança veicular estão em condições de uso? (freio, pneu, iluminação, cinto de segurança)",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-048",
        "texto": "O veículo está calçado, freado e sinalizado (estabilizado, sapatas abertas e niveladas)?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-049",
        "texto": "O gancho do munck e as travas da sapata estão em condições de uso?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-050",
        "texto": "A cabine e carroceria do caminhão estão limpas e organizadas? Há objetos sobre o painel?",
        "peso": 1,
        "gravidade": "Leve"
      },
      {
        "id": "goman-051",
        "texto": "O gráfico de carga dos equipamentos está devidamente sinalizada e visível?",
        "peso": 1,
        "gravidade": "Leve"
      },
      {
        "id": "goman-052",
        "texto": "A capacidade de carga da cinta e/ou pega poste é compatível com a carga a ser içada?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-053",
        "texto": "O pino da trava de segurança das patola estão travados?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-054",
        "texto": "A quantidade de carga transportada é compatível com o veículo? E estão em condições de serem transportadas durante o trajeto e descarregas em condição segura?",
        "peso": 3,
        "gravidade": "Médio"
      }
    ]
  },
  {
    "id": "trabalho-em-altura",
    "label": "TRABALHO EM ALTURA",
    "perguntas": [
      {
        "id": "goman-055",
        "texto": "Fez a amarração correta da escada no centro e topo?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-056",
        "texto": "Utilizou balde de lona para içamento de materiais e ferramentas?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "goman-057",
        "texto": "Utilizou corretamente o cinto de segurança, talabarte e trava quedas em trabalho em altura?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "goman-058",
        "texto": "O parceiro da atividade segurou a escada durante a escalada?",
        "peso": 3,
        "gravidade": "Médio"
      }
    ]
  }
]
export const totalPerguntasGoman = gomanChecklist.reduce(
  (n, c) => n + c.perguntas.length,
  0,
)
