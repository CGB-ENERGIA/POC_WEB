import type { CategoriaGoman } from "./goman-checklist";

export const alojamentoChecklist: CategoriaGoman[] = [
  {
    id: "republicas",
    label: "Repúblicas",
    perguntas: [
      { id: "alj-001", texto: "Há instalações elétricas protegidas e possuem ventilação e iluminação adequadas?", peso: 5, gravidade: "Grave" },
      { id: "alj-002", texto: "Nas instalações há paredes com pé-direito mínimo de 2,50m, pisos e cobertura que proteja contra as intempéries e não existe tricas e/ou rachaduras e as estruturas da cobertura estão em perfeito estado de conservação?", peso: 5, gravidade: "Grave" },
      { id: "alj-003", texto: "Nos sanitários há lavatório, mictório 0,50m do piso e vaso sanitário, com descarga, na proporção de 1 para 20 trabalhadores e chuveiro na proporção de 1 para 10 trabalhadores?", peso: 1, gravidade: "Leve" },
      { id: "alj-004", texto: "Onde não houver serviço de esgoto, há uso de fossa adequada?", peso: 1, gravidade: "Leve" },
      { id: "alj-005", texto: "Todos os cômodos do Alojamento são providos de rede de iluminação, cuja fiação seja protegida por eletrodutos/canaletas nas paredes?", peso: 5, gravidade: "Grave" },
      { id: "alj-006", texto: "Nos sanitários há portas com trinco de acesso que impeçam o devassamento?", peso: 1, gravidade: "Leve" },
      { id: "alj-007", texto: "As paredes dos sanitários são de material resistente e lavável e os pisos são impermeáveis?", peso: 3, gravidade: "Médio" },
      { id: "alj-008", texto: "Os gabinetes sanitários são ventilados para o exterior ou possuem exaustor?", peso: 3, gravidade: "Médio" },
      { id: "alj-009", texto: "Os sanitário possuem recipientes com tampa, para guarda de papéis servidos?", peso: 1, gravidade: "Leve" },
      { id: "alj-010", texto: "Nos vestiários há armários individuais dotados de fechadura ou dispositivo com cadeado?", peso: 1, gravidade: "Leve" },
      { id: "alj-011", texto: "Nos dormitórios há área mínima de 3,00m² por módulo cama/armário, incluindo a área de circulação de 1m de largura?", peso: 1, gravidade: "Leve" },
      { id: "alj-012", texto: "Nos dormitórios quando houver camas duplas as mesmas possuem escadas e proteção lateral?", peso: 1, gravidade: "Leve" },
      { id: "alj-013", texto: "As camas e colchões estão em bons estados e conservação, possuem registro do IMETRO, dentro da validade e com densidade igual ou superior a 27?", peso: 5, gravidade: "Grave" },
      { id: "alj-014", texto: "Nos dormitórios há lençol, fronha, cobertor, se necessário, e travesseiro em condições adequadas de higiene e armários individuais?", peso: 5, gravidade: "Grave" },
      { id: "alj-015", texto: "Água potável fornecida aos trabalhadores em condições higiênicas, por meio de copos individuais ou bebedouros de jato inclinado e guarda protetora, sendo ainda proibido o uso de recipientes coletivos. Garantia de suprimento de água potável e fresca em quantidade superior a 1/4 (um quarto) de litro (250ml) por hora/homem trabalho.", peso: 5, gravidade: "Grave" },
      { id: "alj-016", texto: "Na cozinha há equipamento de refrigeração, pia para lavar os alimentos e utensílios e recipiente com tampa para coleta de lixo?", peso: 3, gravidade: "Médio" },
      { id: "alj-017", texto: "Quando utilizado GLP, os botijões ficam instalados fora do ambiente de utilização, em área permanentemente ventilada e coberta?", peso: 5, gravidade: "Grave" },
      { id: "alj-018", texto: "Os alimentos estão acondicionados de maneira correta, preservando a higiene e estando dentro dos prazos de validade?", peso: 5, gravidade: "Grave" },
      { id: "alj-019", texto: "O local para a realização das refeições é adequado, possuindo mesas e cadeiras?", peso: 5, gravidade: "Grave" },
      { id: "alj-020", texto: "No alojamento há local próprio, coberto, ventilado e iluminado, com tanques individuais ou coletivos em número adequado, para que o trabalhador alojado possa lavar, secar e passar suas roupas de uso pessoal?", peso: 5, gravidade: "Grave" },
      { id: "alj-021", texto: "As paredes e tetos e/ou forros da edificação estão em bom estado de conservação (pintura, reboco, sinais de infiltração)?", peso: 5, gravidade: "Grave" },
      { id: "alj-022", texto: "Há sinais de presença de insetos e/ou pragas (pombos, morcegos, ratos, entre outros) nas instalações prediais?", peso: 5, gravidade: "Grave" },
      { id: "alj-023", texto: "Nos alojamentos e/ou republicas são protegidos com muros ou cercas que impeçam o acesso de terceiros?", peso: 5, gravidade: "Grave" },
      { id: "alj-024", texto: "As instalações estão limpas e organizadas?", peso: 5, gravidade: "Grave" },
      { id: "alj-025", texto: "Os compartimentos destinados a chuveiro dispõe de água quente e fria?", peso: 5, gravidade: "Grave" },
      { id: "alj-026", texto: "As instalações sanitárias, roupas de cama e demais ambientes encontram-se devidamente limpos e higienizados? Há presença de aranhas ou outros insetos?", peso: 1, gravidade: "Leve" },
      { id: "alj-027", texto: "O adesivo de controle de limpeza está disponível e devidamente preenchido após a realização da faxina?", peso: 1, gravidade: "Leve" },
      { id: "alj-028", texto: "O quadro de distribuição possui o adesivo de identificação?", peso: 1, gravidade: "Leve" },
      { id: "alj-029", texto: "A instalação elétrica possui dispositivo DR (Dispositivo Diferencial Residual)?", peso: 1, gravidade: "Leve" },
      { id: "alj-030", texto: "As portas e os respectivos trincos encontram-se em boas condições de conservação e funcionamento?", peso: 1, gravidade: "Leve" },
      { id: "alj-031", texto: "Os cestos de lixo possuem tampa e estão em condições adequadas de uso?", peso: 1, gravidade: "Leve" },
      { id: "alj-032", texto: "Os banheiros possuem suporte para sabonete e papel higiênico, em condições adequadas de uso?", peso: 1, gravidade: "Leve" },
      { id: "alj-033", texto: "Há disponibilidade de papel-toalha e copos descartáveis?", peso: 1, gravidade: "Leve" },
      { id: "alj-034", texto: "Os materiais estão devidamente organizados, separados e acondicionados de forma adequada?", peso: 1, gravidade: "Leve" },
      { id: "alj-035", texto: "A área externa encontra-se limpa e livre de mato, entulhos e materiais inadequadamente armazenados?", peso: 1, gravidade: "Leve" },
      { id: "alj-036", texto: "Os ventiladores possuem grades de proteção e encontram-se devidamente limpos?", peso: 1, gravidade: "Leve" },
      { id: "alj-037", texto: "A geladeira e o fogão apresentam condições adequadas de limpeza, conservação e funcionamento?", peso: 1, gravidade: "Leve" },
      { id: "alj-038", texto: "Os alimentos estão devidamente armazenados, acondicionados e organizados em condições adequadas de higiene e conservação?", peso: 1, gravidade: "Leve" },
      { id: "alj-039", texto: "Os produtos de limpeza estão devidamente armazenados em local adequado, organizado e seguro, separados dos alimentos e de outros materiais de uso?", peso: 1, gravidade: "Leve" },
    ],
  },
];

export const totalPerguntasAlojamento = alojamentoChecklist.reduce(
  (sum, cat) => sum + cat.perguntas.length, 0
);
