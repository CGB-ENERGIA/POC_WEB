export type Gravidade = "Leve" | "Médio" | "Grave"
export type RespostaChecklist = "conforme" | "nao_conforme" | null

export interface PerguntaGstc {
  id: string
  texto: string
  peso: number
  gravidade: Gravidade
}

export interface CategoriaGstc {
  id: string
  label: string
  perguntas: PerguntaGstc[]
}

export interface RespostaPerguntaGstc {
  perguntaId: string
  resposta: Exclude<RespostaChecklist, null>
  observacao?: string
  foto?: string
}

export const gstcChecklist: CategoriaGstc[] = [
  {
    "id": "apr",
    "label": "APR",
    "perguntas": [
      {
        "id": "gstc-001",
        "texto": "Foi analisado a possibilidade da existência do risco de Acidente de Trânsito durante execução da atividade?  Se existir, foram adotadas as medidas de controle?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-002",
        "texto": "Foi analisado a possibilidade de Agressão de Terceiro e/ou ataque Animal durante a execução da atividade? Se existir, foram adotadas as medidas de controle?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-003",
        "texto": "Quanto aos Riscos de Trabalho em Solo, foi analisado se existe, no local de trabalho, desnível, irregularidade no piso, buracos, obstáculos, ou superfície lisa que potencialize risco de queda, tropeço escorregão? Se existir, foram adotadas as medidas de controle?",
        "peso": 1,
        "gravidade": "Leve"
      },
      {
        "id": "gstc-004",
        "texto": "Nos Riscos de Trabalho em Solo, foi analisado se existem objetos cortantes ou perfurantes que podem ocasionar acidente? Se existir, foram adotadas as medidas de controle?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-005",
        "texto": "Nos Riscos de Trabalho em Solo, foi analisado se existe o risco de contato com superfície abrasiva, escoriante, perfurante ou cortante durante o manuseio de ferramentas e materiais de trabalho? Se existir, foram adotadas as medidas de controle?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-006",
        "texto": "Foram analisados os Riscos de Trabalho em Altura quanto a queda de materiais? Se existir, foram adotadas as medidas de controle?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-007",
        "texto": "Foram analisados os Riscos de Trabalho em Altura quanto as condições da estrutura de apoio da escada? Se existir, foram adotadas as medidas de controle?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-008",
        "texto": "Foram analisados os Riscos de Trabalho em Altura quanto ao risco de queda de altura? Se existir, foram adotadas as medidas de controle?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "gstc-009",
        "texto": "Foram analisados os Riscos de Trabalho em Altura quanto a estrutura do poste? Se existir, foram adotadas as medidas de controle?",
        "peso": 1,
        "gravidade": "Leve"
      },
      {
        "id": "gstc-010",
        "texto": "Sobre o Risco de Choque e Arco Elétrico foi analisado se a atividade será realizada com equipamento e/ou rede energizada? Existe risco de choque elétrico? Se existir, foram adotadas as medidas de controle?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-011",
        "texto": "Sobre o Risco de Choque e Arco Elétrico, foi analisado se há o risco de contato e/ou proximidade acidental com partes energizadas? Se existir, foram adotadas as medidas de controle?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-012",
        "texto": "Sobre o Risco de Choque e Arco Elétrico, foi analisado se existe o risco de curto-circuito e/ou arco elétrico? Se existir, foram adotadas as medidas de controle?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-013",
        "texto": "Sobre o Risco de Choque e Arco Elétrico, foi analisado se o trabalho será realizado com rede desenergizada e se há risco de energização acidental? Se existir, foram adotadas as medidas de controle?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "gstc-014",
        "texto": "Sobre Outros Riscos da atividade, foi analisada se os envolvidos estão em condições (física e psicológica) para realização da tarefa?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "gstc-015",
        "texto": "Sobre Outros Riscos da atividade, foi analisado se há possível falha na comunicação com o COI? O COI tem conhecimento da presença da equipe para execução da atividade?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "gstc-016",
        "texto": "Sobre Outros Riscos da atividade, foi identificado o responsável pela constatação da ausência de tensão e/ou aterramento temporário?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-017",
        "texto": "Além dos mencionados foram percebidos Outros Riscos na execução atividade?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-018",
        "texto": "Considerando todas as ações realizadas é possível desenvolver esta atividade com segurança?",
        "peso": 1,
        "gravidade": "Leve"
      },
      {
        "id": "gstc-019",
        "texto": "Existia risco para Recusa da atividade? Foi apresentado as evidências do risco da atividade?",
        "peso": 1,
        "gravidade": "Leve"
      },
      {
        "id": "gstc-020",
        "texto": "Foi preenchido o nome de todos os colaboradores e assinada?",
        "peso": 1,
        "gravidade": "Leve"
      },
    ]
  },
  {
    "id": "regras-de-ouro",
    "label": "REGRAS DE OURO",
    "perguntas": [
      {
        "id": "gstc-021",
        "texto": "Cumpriu a etapa da Regra de Ouro: DESLIGAR?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-022",
        "texto": "Cumpriu a etapa da Regra de Ouro: BLOQUEAR?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-023",
        "texto": "Cumpriu a etapa da Regra de Ouro: SINALIZAR?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-024",
        "texto": "Cumpriu a etapa da Regra de Ouro: TESTAR?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-025",
        "texto": "Cumpriu a etapa da Regra de Ouro: ATERRAR?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-026",
        "texto": "Cumpriu a etapa da Regra de Ouro: PROTEGER?",
        "peso": 5,
        "gravidade": "Grave"
      },
    ]
  },
  {
    "id": "padrinho-seguranca",
    "label": "PADRINHO DE SEGURANÇA",
    "perguntas": [
      {
        "id": "gstc-027",
        "texto": "O Padrinho de Segurança está supervisionando a execução da atividade?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-028",
        "texto": "O Padrinho de Segurança se comunica e orienta a execução da atividade?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-029",
        "texto": "O Padrinho de Segurança interviu para evitar desvios?",
        "peso": 5,
        "gravidade": "Grave"
      },
    ]
  },
  {
    "id": "epi-epc-ferramentas",
    "label": "EPI, EPC e FERRAMENTAS",
    "perguntas": [
      {
        "id": "gstc-030",
        "texto": "O EPI luvas isolante está em condições de uso? Está em vigência o teste dielétrico?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-031",
        "texto": "O EPI manga isolante está em condições de uso? Está em vigência o teste dielétrico?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-032",
        "texto": "O EPI protetor facial está em condições de uso?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-033",
        "texto": "Os EPI (capacete, vestimenta, bota de segurança, etc.) estão em condições de uso?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-034",
        "texto": "Os EPIs para Trabalho em Altura (Cinto, Talabarte, Trava quedas, Linha de vida, etc) estão em condições de uso ?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-035",
        "texto": "O EPC mantas isolantes estão em condições de uso? Está em vigência o teste dielétrico?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-036",
        "texto": "O EPC tapete isolante está em condições de uso? Está em vigência o teste dielétrico?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-037",
        "texto": "O EPC vara de manobra está em condições de uso?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-038",
        "texto": "Os EPC (cones, fita de sinalização, etc.) estão em condições de uso?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "gstc-039",
        "texto": "Os EPC escadas extensiva e singela estão em condições de uso?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-040",
        "texto": "As Ferramentas (chaves, alicates, etc.) estão em condições de uso?",
        "peso": 1,
        "gravidade": "Leve"
      },
      {
        "id": "gstc-041",
        "texto": "As Ferramentas (detector de tensão, teste neon) estão em condições de uso?",
        "peso": 5,
        "gravidade": "Grave"
      },
    ]
  },
  {
    "id": "procedimento",
    "label": "PROCEDIMENTO",
    "perguntas": [
      {
        "id": "gstc-042",
        "texto": "A equipe possui os Procedimentos Operacionais Padrão das suas atividades?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "gstc-043",
        "texto": "A área de trabalho está sinalizada e delimitada com cones e fitas de sinalização, e demarcação da rota de fuga?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "gstc-044",
        "texto": "O veículo está estacionado corretamente?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "gstc-045",
        "texto": "Utilizou adornos durante a execução da atividade?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "gstc-046",
        "texto": "Foi seccionado o disjuntor e fez o teste de presença de tensão?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-047",
        "texto": "Na substituição de medidores trifásicos foi realizado a desconexão do ramal de ligação do cliente na rede BT?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-048",
        "texto": "Utilizou os EPI (Vestimenta, capacete de segurança com jugular, luvas isolantes, mangas isolantes, protetor facial etc.) corretamente?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-049",
        "texto": "Utilizou os EPC (detector de ausência de tensão, mantas isolantes, tapete isolante, vara de manobra etc.) corretamente?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-050",
        "texto": "Fez o teste de ausência de tensão em fibras óticas, luminárias e fiações de IP?",
        "peso": 5,
        "gravidade": "Grave"
      },
    ]
  },
  {
    "id": "veiculos-equipamentos",
    "label": "VEÍCULOS E EQUIPAMENTOS",
    "perguntas": [
      {
        "id": "gstc-051",
        "texto": "A documentação do veículo/equipamento (CRLV, ART, manual de operação) está correta?",
        "peso": 1,
        "gravidade": "Leve"
      },
      {
        "id": "gstc-052",
        "texto": "O checklist veicular foi preenchido corretamente?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "gstc-053",
        "texto": "Itens de segurança veicular estão em condições de uso? (freio, pneu, iluminação, cinto de segurança)",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-054",
        "texto": "O veículo está calçado, freado e sinalizado (estabilizado, sapatas abertas e niveladas)?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-055",
        "texto": "A cabine e carroceria do veículo estão limpas e organizadas?",
        "peso": 1,
        "gravidade": "Leve"
      },
    ]
  },
  {
    "id": "trabalho-em-altura",
    "label": "TRABALHO EM ALTURA",
    "perguntas": [
      {
        "id": "gstc-056",
        "texto": "Fez a amarração correta da escada no centro e topo?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-057",
        "texto": "Utilizou balde de lona para içamento de materiais e ferramentas?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "gstc-058",
        "texto": "Colaborador durante escalada posicionou o Trava quedas com fator de queda zero( acima do nível do peito) ?",
        "peso": 3,
        "gravidade": "Médio"
      },
      {
        "id": "gstc-059",
        "texto": "Utilizou corretamente o cinto de segurança, talabarte e trava quedas em trabalho em altura?",
        "peso": 5,
        "gravidade": "Grave"
      },
      {
        "id": "gstc-060",
        "texto": "O parceiro da atividade segurou a escada durante a escalada?",
        "peso": 3,
        "gravidade": "Médio"
      },
    ]
  },
]

export const totalPerguntasGstc = 60
