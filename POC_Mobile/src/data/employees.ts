export interface Employee {
  matricula: string
  nome: string
  nomeCompleto: string
  gerencia: string
  base: string
  funcao: string
  /** @deprecated Use getMetaMensal() — metas derivadas de getMetaSemanal() */
  meta: number
}

export const META_SEMANAL_TECNICO_SEGURANCA = 5
export const META_SEMANAL_PADRAO = 2

export const SEMANAS_POR_MES = 4

export function isTecnicoSeguranca(
  employee: Pick<Employee, "gerencia" | "funcao">
): boolean {
  const funcao = employee.funcao.toLowerCase()
  return (
    employee.gerencia === "SESMT" ||
    funcao.includes("hse") ||
    funcao.includes("sesmt") ||
    funcao.includes("seguranca")
  )
}

export function getMetaSemanal(
  employee: Pick<Employee, "gerencia" | "funcao">
): number {
  return isTecnicoSeguranca(employee)
    ? META_SEMANAL_TECNICO_SEGURANCA
    : META_SEMANAL_PADRAO
}

export function getMetaMensal(
  employee: Pick<Employee, "gerencia" | "funcao">
): number {
  return getMetaSemanal(employee) * SEMANAS_POR_MES
}

export const employees: Employee[] = [
  // ── BCB ───────────────────────────────────────────────────────────────
  { matricula: "23847", nome: "Afonso", nomeCompleto: "Afonso Lucas Campos Alcantara", gerencia: "GSTC", base: "BCB", funcao: "Coordenador", meta: 2 },
  { matricula: "462", nome: "Antonio R.", nomeCompleto: "Antonio Marcos Salazar dos Reis", gerencia: "GERE", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "12512", nome: "Deilton", nomeCompleto: "Deilton Souza Ribeiro", gerencia: "GSTC", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "12558", nome: "Diego A.", nomeCompleto: "Diego Santos Alencar", gerencia: "GERE", base: "BCB", funcao: "Fiscal", meta: 2 },
  { matricula: "12471", nome: "Dyulijan", nomeCompleto: "Dyulijan Pereira de Oliveira", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "13516", nome: "Elismar", nomeCompleto: "Elismar Rocha de Sousa", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "13315", nome: "Everaldo", nomeCompleto: "Everaldo Nogueira Filho", gerencia: "GOMAN", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "12582", nome: "Francisco Ada.", nomeCompleto: "Francisco Adalton de Oliveira Lima", gerencia: "GSTC", base: "BCB", funcao: "Fiscal", meta: 2 },
  { matricula: "12509", nome: "Francisco Cha.", nomeCompleto: "Francisco das Chagas Pereira Lima", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "12570", nome: "Francisco G.", nomeCompleto: "Francisco Flavio Reis Gomes", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "23742", nome: "Francisco S.", nomeCompleto: "Francisco Leandro Nunes da Silva", gerencia: "SESMT", base: "BCB", funcao: "Tec. Seguranca", meta: 5 },
  { matricula: "12576", nome: "Gleyson", nomeCompleto: "Gleyson de Sousa Silva", gerencia: "GSTC", base: "BCB", funcao: "Fiscal", meta: 2 },
  { matricula: "13947", nome: "Isaac", nomeCompleto: "Isaac da Cunha Alves Silva", gerencia: "GERE", base: "BCB", funcao: "Fiscal", meta: 2 },
  { matricula: "15565", nome: "Jackson", nomeCompleto: "Jackson Kentelly Marculino de Souza", gerencia: "ADM", base: "BCB", funcao: "Administrativo", meta: 2 },
  { matricula: "22025", nome: "Julio", nomeCompleto: "Julio Cesar de Souza Sangi", gerencia: "GERE", base: "BCB", funcao: "Coordenador", meta: 2 },
  { matricula: "12595", nome: "Lucas A.", nomeCompleto: "Lucas Alves de Almeida", gerencia: "GSTC", base: "BCB", funcao: "Fiscal", meta: 2 },
  { matricula: "16153", nome: "Lucas S.", nomeCompleto: "Lucas Moreira de Souza", gerencia: "OFICINA", base: "BCB", funcao: "Coordenador", meta: 2 },
  { matricula: "12746", nome: "Luis A.", nomeCompleto: "Luis Filipe Cantanhede Alves", gerencia: "GERE", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "12597", nome: "Manoel P.", nomeCompleto: "Manoel da Silva Protasio", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "13080", nome: "Mikeias", nomeCompleto: "Mikeias Veloso Pinheiro", gerencia: "GOMAN", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "12672", nome: "Moises", nomeCompleto: "Moises Ferreira de Sousa", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "21574", nome: "Normam", nomeCompleto: "Normam Matheus Barros de Oliveira", gerencia: "SESMT", base: "BCB", funcao: "Tec. Seguranca", meta: 5 },
  { matricula: "12517", nome: "Ofelio", nomeCompleto: "Ofelio de Sousa Alves", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "12516", nome: "Pablo", nomeCompleto: "Pablo Silva Loura", gerencia: "GOMAN", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "12354", nome: "Pryscilla", nomeCompleto: "Pryscilla Cristyane Oliveira de Faria", gerencia: "ADM", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "13744", nome: "Raimundo Rib.", nomeCompleto: "Raimundo Ribeiro da Silva Filho", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "12483", nome: "Renato M.", nomeCompleto: "Renato Silva de Matos", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "15559", nome: "Ricardo", nomeCompleto: "Ricardo Malta da Cunha", gerencia: "GOMAN", base: "BCB", funcao: "Coordenador", meta: 2 },
  { matricula: "14475", nome: "Ruan", nomeCompleto: "Ruan Valmir de Souza Silva", gerencia: "OFICINA", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "12513", nome: "Wanderson", nomeCompleto: "Wanderson Ribeiro Vale", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "12506", nome: "Werbeth", nomeCompleto: "Werbeth Rodrigues Carvalho", gerencia: "GOMAN", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "12383", nome: "Weyderson", nomeCompleto: "Weyderson Juan da Costa Santos", gerencia: "ADM", base: "BCB", funcao: "Administrativo", meta: 2 },
  // ── BDC ───────────────────────────────────────────────────────────────
  { matricula: "13023", nome: "Bruno", nomeCompleto: "Bruno Oliveira da Silva", gerencia: "GSTC", base: "BDC", funcao: "Fiscal", meta: 2 },
  { matricula: "18311", nome: "Cleomar", nomeCompleto: "Cleomar Vieira da Silva", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "13750", nome: "Geraldo", nomeCompleto: "Geraldo Moreira Rodrigues", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "17753", nome: "Idialdo", nomeCompleto: "Idialdo dos Santos Coimbra", gerencia: "GOMAN", base: "BDC", funcao: "Supervisor", meta: 2 },
  { matricula: "12572", nome: "Jarbem", nomeCompleto: "Jarbem Rosa Sousa", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "17462", nome: "Joao A.", nomeCompleto: "Joao Lucas Rodrigues Apoliano", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "13518", nome: "Jose B.", nomeCompleto: "Jose Francisco Rodrigues Batista", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "12851", nome: "Josiel", nomeCompleto: "Josiel Meneses dos Santos", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "12938", nome: "Lucas C.", nomeCompleto: "Lucas Oliveira Costa", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "15455", nome: "Marcos", nomeCompleto: "Marcos Felipe de Andrade Silva", gerencia: "GOMAN", base: "BDC", funcao: "Coordenador", meta: 2 },
  { matricula: "21614", nome: "Nilo", nomeCompleto: "Nilo Goncalves da Silva Filho", gerencia: "SESMT", base: "BDC", funcao: "Tec. Seguranca", meta: 5 },
  // ── ITM ───────────────────────────────────────────────────────────────
  { matricula: "12762", nome: "Cristophe", nomeCompleto: "Cristophe Daniel dos Santos Melo", gerencia: "GOMAN", base: "ITM", funcao: "Supervisor", meta: 2 },
  { matricula: "13746", nome: "Ednaldo", nomeCompleto: "Ednaldo da Silva Lima", gerencia: "GOMAN", base: "ITM", funcao: "Encarregado", meta: 2 },
  { matricula: "12751", nome: "Gilson", nomeCompleto: "Gilson Ricardo Silva Cunha", gerencia: "GOMAN", base: "ITM", funcao: "Encarregado", meta: 2 },
  { matricula: "4745", nome: "Hittalo", nomeCompleto: "Hittalo Moraes da Silva", gerencia: "GOMAN", base: "ITM", funcao: "Encarregado", meta: 2 },
  { matricula: "12792", nome: "Ivanilson", nomeCompleto: "Ivanilson Ricardo Oliveira Santos", gerencia: "GOMAN", base: "ITM", funcao: "Encarregado", meta: 2 },
  { matricula: "12749", nome: "Joao C.", nomeCompleto: "Joao Batista da Silva Chagas", gerencia: "GOMAN", base: "ITM", funcao: "Encarregado", meta: 2 },
  { matricula: "12686", nome: "Jose Rai.", nomeCompleto: "Jose Raimundo Costa Filho", gerencia: "GOMAN", base: "ITM", funcao: "Encarregado", meta: 2 },
  { matricula: "12800", nome: "Leonardo A.", nomeCompleto: "Leonardo Estrela Anchieta", gerencia: "GSTC", base: "ITM", funcao: "Supervisor", meta: 2 },
  { matricula: "12724", nome: "Raimundo M.", nomeCompleto: "Raimundo Nonato Sousa Matos", gerencia: "GSTC", base: "ITM", funcao: "Fiscal", meta: 2 },
  { matricula: "12745", nome: "Washington", nomeCompleto: "Washington Soares de Souza", gerencia: "GSTC", base: "ITM", funcao: "Fiscal", meta: 2 },
  { matricula: "21925", nome: "Welrisson", nomeCompleto: "Welrisson Oliveira Sousa", gerencia: "SESMT", base: "ITM", funcao: "Tec. Seguranca", meta: 5 },
  // ── PDS ───────────────────────────────────────────────────────────────
  { matricula: "12884", nome: "Beneth", nomeCompleto: "Beneth Erikson Santos Cavalcante", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "14983", nome: "Candido", nomeCompleto: "Candido Gabriel de Melo Silva Soares", gerencia: "GOMAN", base: "PDS", funcao: "Tec. Planejamento", meta: 2 },
  { matricula: "12813", nome: "Everton", nomeCompleto: "Everton Siqueira Pereira", gerencia: "SESMT", base: "PDS", funcao: "Supervisor", meta: 5 },
  { matricula: "13748", nome: "Fernando", nomeCompleto: "Fernando Melo da Costa", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "12822", nome: "Janes", nomeCompleto: "Janes da Costa Melo", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "13035", nome: "Joao J.", nomeCompleto: "Joao Climaco Medeiros de Azevedo Junior", gerencia: "GOMAN", base: "PDS", funcao: "Supervisor", meta: 2 },
  { matricula: "12820", nome: "Jose Air.", nomeCompleto: "Jose Airton do Carmo Melo Filho", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "16331", nome: "Josielington", nomeCompleto: "Josielington Paz de Oliveira", gerencia: "SESMT", base: "PDS", funcao: "Tec. Seguranca", meta: 5 },
  { matricula: "12848", nome: "Manuel", nomeCompleto: "Manuel Silva Junior", gerencia: "GOMAN", base: "PDS", funcao: "Fiscal", meta: 2 },
  { matricula: "12818", nome: "Messias", nomeCompleto: "Messias Abreu dos Santos", gerencia: "GOMAN", base: "PDS", funcao: "Supervisor", meta: 2 },
  { matricula: "12852", nome: "Patrick", nomeCompleto: "Patrick Amaro Ferreira", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "12847", nome: "Paulo Sil.", nomeCompleto: "Paulo Silva Ferreira", gerencia: "GSTC", base: "PDS", funcao: "Fiscal", meta: 2 },
  { matricula: "12842", nome: "Raimundo S.", nomeCompleto: "Raimundo Hermesson Brito Vieira da Silva", gerencia: "GSTC", base: "PDS", funcao: "Supervisor", meta: 2 },
  { matricula: "12882", nome: "Raimundo Non.", nomeCompleto: "Raimundo Nonato da Costa Filho", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "12844", nome: "Reinaldo", nomeCompleto: "Reinaldo Santana de Lima", gerencia: "GSTC", base: "PDS", funcao: "Fiscal", meta: 2 },
  { matricula: "16138", nome: "Thomas", nomeCompleto: "Thomas Lucas da Silva Lima", gerencia: "GERE", base: "PDS", funcao: "Fiscal", meta: 2 },
  { matricula: "12849", nome: "Valdei", nomeCompleto: "Valdei Oliveira Silva", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "17751", nome: "Vanilson", nomeCompleto: "Vanilson Siqueira Furtado", gerencia: "GSTC", base: "PDS", funcao: "Fiscal", meta: 2 },
  // ── PDT ───────────────────────────────────────────────────────────────
  { matricula: "20868", nome: "Alex", nomeCompleto: "Alex Machado da Silva", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "21141", nome: "Andre", nomeCompleto: "Andre Silva de Sousa", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "12889", nome: "Antonio Mar.", nomeCompleto: "Antonio Marcos Santos Alencar", gerencia: "GOMAN", base: "PDT", funcao: "Supervisor", meta: 2 },
  { matricula: "12489", nome: "Antonio V.", nomeCompleto: "Antonio Samuel Silva Viana", gerencia: "GSTC", base: "PDT", funcao: "Fiscal", meta: 2 },
  { matricula: "12891", nome: "Antonio Sil.", nomeCompleto: "Antonio Silva de Abreu", gerencia: "SESMT", base: "PDT", funcao: "Supervisor", meta: 5 },
  { matricula: "13009", nome: "Ariosvaldo", nomeCompleto: "Ariosvaldo Alves Soares", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "12913", nome: "Augusto", nomeCompleto: "Augusto Cesar da Silva", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "19837", nome: "Camila", nomeCompleto: "Camila Correa Araujo", gerencia: "ADM", base: "PDT", funcao: "Coordenador", meta: 2 },
  { matricula: "12898", nome: "Carlos F.", nomeCompleto: "Carlos Sandro da Silva Florencio", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "17747", nome: "Daciel", nomeCompleto: "Daciel Pereira Ramos", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "21607", nome: "Dario", nomeCompleto: "Dario Franca Fernandes de Sousa", gerencia: "SESMT", base: "PDT", funcao: "Tec. Seguranca", meta: 5 },
  { matricula: "24046", nome: "Davi", nomeCompleto: "Davi Cabral Santos", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "24088", nome: "Edivaldo", nomeCompleto: "Edivaldo Silva do Nascimento", gerencia: "GSTC", base: "PDT", funcao: "Fiscal", meta: 2 },
  { matricula: "13818", nome: "Edson", nomeCompleto: "Edson de Souza Pereira", gerencia: "GERE", base: "PDT", funcao: "Fiscal", meta: 2 },
  { matricula: "12892", nome: "Francisco R.", nomeCompleto: "Francisco de Assis Araujo Rodrigues", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "12939", nome: "Gabriel", nomeCompleto: "Gabriel do Carmo Costa", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "12998", nome: "Guilherme", nomeCompleto: "Guilherme Fonseca de Sousa Nogueira", gerencia: "GSTC", base: "PDT", funcao: "Fiscal", meta: 2 },
  { matricula: "12955", nome: "Maicon", nomeCompleto: "Maicon Douglas Silva Alves", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "17463", nome: "Marcirio", nomeCompleto: "Marcirio Cesar Viana da Silva Neto", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "12981", nome: "Marcus", nomeCompleto: "Marcus Vinicius Soares Lima", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "24109", nome: "Rafael", nomeCompleto: "Rafael Pereira da Silva", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "22546", nome: "Rafaela", nomeCompleto: "Rafaela Melo Candido da Silva", gerencia: "GOMAN", base: "PDT", funcao: "Coordenador", meta: 2 },
  { matricula: "12719", nome: "Raimundo N.", nomeCompleto: "Raimundo Nonato Almeida do Nascimento", gerencia: "GOMAN", base: "PDT", funcao: "Supervisor", meta: 2 },
  { matricula: "13021", nome: "Raurison", nomeCompleto: "Raurison Cardim Oliveira", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "16939", nome: "Silman", nomeCompleto: "Silman Mario Santos Lima", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "12928", nome: "Vilson", nomeCompleto: "Vilson Alves Ferreira", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "23605", nome: "Waldir", nomeCompleto: "Waldir Carlos da Silva Junior", gerencia: "ADM", base: "PDT", funcao: "Gerente", meta: 2 },
  { matricula: "22511", nome: "Wemeson", nomeCompleto: "Wemeson da Silva Oliveira", gerencia: "GSTC", base: "PDT", funcao: "Fiscal", meta: 2 },
  // ── STI ───────────────────────────────────────────────────────────────
  { matricula: "13032", nome: "Arlison", nomeCompleto: "Arlison Rogerio Martins Lima", gerencia: "GSTC", base: "STI", funcao: "Supervisor", meta: 2 },
  { matricula: "24036", nome: "Carlos O.", nomeCompleto: "Carlos Rodrigues Oliveira", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "12650", nome: "Diego L.", nomeCompleto: "Diego Sousa de Lima", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "14587", nome: "Edivan", nomeCompleto: "Edivan de Lima Carvalho", gerencia: "GOMAN", base: "STI", funcao: "Supervisor", meta: 2 },
  { matricula: "23741", nome: "Francisco F.", nomeCompleto: "Francisco Junior Lima Fontenele", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "17084", nome: "Hugo", nomeCompleto: "Hugo Leonardo Vieira da Silveira", gerencia: "GERE", base: "STI", funcao: "Fiscal", meta: 2 },
  { matricula: "13410", nome: "Joel", nomeCompleto: "Joel Pereira de Araujo Filho", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "20270", nome: "Joise", nomeCompleto: "Joise Kaciele Pereira Marques", gerencia: "SESMT", base: "STI", funcao: "Tec. Seguranca", meta: 5 },
  { matricula: "13073", nome: "Jorden", nomeCompleto: "Jorden Cleyson de Lucena Mota", gerencia: "GSTC", base: "STI", funcao: "Fiscal", meta: 2 },
  { matricula: "13754", nome: "Jose M.", nomeCompleto: "Jose Pedro Goncalves Moura", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "12742", nome: "Joselmo", nomeCompleto: "Joselmo Gomes dos Santos", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "13100", nome: "Leonardo L.", nomeCompleto: "Leonardo Martins de Lima", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "12515", nome: "Luis S.", nomeCompleto: "Luis Carlos de Souza", gerencia: "GOMAN", base: "STI", funcao: "Supervisor", meta: 2 },
  { matricula: "13077", nome: "Madson", nomeCompleto: "Madson Felix da Silva", gerencia: "GSTC", base: "STI", funcao: "Fiscal", meta: 2 },
  { matricula: "120", nome: "Manoel R.", nomeCompleto: "Manoel do Nascimento Pereira Rodrigues", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "13099", nome: "Mateus", nomeCompleto: "Mateus Antonio Viegas Lima", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "12467", nome: "Paulo Ces.", nomeCompleto: "Paulo Cesar Rodrigues Ferreira", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "12479", nome: "Renato C.", nomeCompleto: "Renato Ramos Carvalho", gerencia: "GSTC", base: "STI", funcao: "Fiscal", meta: 2 },
  { matricula: "13060", nome: "Rosiel", nomeCompleto: "Rosiel Ferreira dos Santos", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
]

export const bases    = ["Todos", "BCB", "BDC", "ITM", "PDS", "PDT", "STI"]
export const gerencias = ["Todos", "ADM", "GERE", "GOMAN", "GSTC", "OFICINA", "SESMT"]

export function findByMatricula(mat: string): Employee | undefined {
  return employees.find(
    e => e.matricula.toLowerCase() === mat.trim().toLowerCase()
  )
}
