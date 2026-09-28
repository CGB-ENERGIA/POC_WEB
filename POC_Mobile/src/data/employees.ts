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

export const META_SEMANAL_ENCARREGADO = 2
export const META_SEMANAL_LIDERANCA = 4
export const META_SEMANAL_TECNICO_SEGURANCA = 8
export const META_SEMANAL_PADRAO = META_SEMANAL_ENCARREGADO

/** @deprecated Mantido para compatibilidade; use diasUteisNoMes() */
export const SEMANAS_POR_MES = 4

// ── Feriados nacionais ────────────────────────────────────────────────────────

function calcularPascoa(ano: number): Date {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(ano, mes - 1, dia)
}

function feriadosNacionais(ano: number): Set<string> {
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
  const pascoa = calcularPascoa(ano)
  const sextaSanta = new Date(pascoa)
  sextaSanta.setDate(pascoa.getDate() - 2)
  return new Set([
    "01/01", "21/04", "01/05", "07/09", "12/10", "02/11", "15/11", "25/12",
    fmt(sextaSanta),
  ])
}

export function diasUteisNoMes(ano: number, mes: number): number {
  const feriados = feriadosNacionais(ano)
  const totalDias = new Date(ano, mes, 0).getDate()
  let count = 0
  for (let d = 1; d <= totalDias; d++) {
    const dow = new Date(ano, mes - 1, d).getDay()
    if (dow === 0 || dow === 6) continue
    const chave = `${String(d).padStart(2, "0")}/${String(mes).padStart(2, "0")}`
    if (!feriados.has(chave)) count++
  }
  return count
}

// ── Meta functions ────────────────────────────────────────────────────────────

export function isTecnicoSeguranca(
  employee: Pick<Employee, "gerencia" | "funcao">
): boolean {
  const funcao = employee.funcao
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
  return (
    employee.gerencia === "SESMT" ||
    funcao.includes("hse") ||
    funcao.includes("sesmt") ||
    funcao.includes("seguranca")
  )
}

export function isLiderancaOperacional(
  employee: Pick<Employee, "gerencia" | "funcao">
): boolean {
  if (isTecnicoSeguranca(employee)) return false
  const funcao = employee.funcao
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
  if (funcao.includes("encarregado")) return false
  return (
    funcao.includes("supervisor") ||
    funcao.includes("coordenador") ||
    funcao.includes("fiscal") ||
    funcao.includes("gerente") ||
    funcao.includes("lideranca") ||
    /\blider\b/.test(funcao)
  )
}

export function getMetaSemanal(
  employee: Pick<Employee, "gerencia" | "funcao">
): number {
  if (isTecnicoSeguranca(employee)) return META_SEMANAL_TECNICO_SEGURANCA
  if (isLiderancaOperacional(employee)) return META_SEMANAL_LIDERANCA
  return META_SEMANAL_ENCARREGADO
}

export function getMetaMensal(
  employee: Pick<Employee, "gerencia" | "funcao">,
  referencia?: Date
): number {
  const data = referencia ?? new Date()
  const dias = diasUteisNoMes(data.getFullYear(), data.getMonth() + 1)
  return Math.min(Math.round(getMetaSemanal(employee) * dias / 5), 20)
}

export const employees: Employee[] = [
  { matricula: "12889", nome: "A. Marcos S. A.", nomeCompleto: "Antonio Marcos Santos Alencar", gerencia: "GERE", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "13795", nome: "Abraão", nomeCompleto: "Abraao dos Santos Silva", gerencia: "GOMAN", base: "BCB", funcao: "Tec. De Planejamento De Produção", meta: 2 },
  { matricula: "12582", nome: "Adalton", nomeCompleto: "Francisco Adalton de Oliveira Lima", gerencia: "GSTC", base: "BCB", funcao: "Fiscal", meta: 2 },
  { matricula: "23847", nome: "Afonso", nomeCompleto: "Afonso Lucas Campos Alcantara", gerencia: "GSTC", base: "BCB", funcao: "Coordenador", meta: 2 },
  { matricula: "12512", nome: "Deilton", nomeCompleto: "Deilton Souza Ribeiro", gerencia: "GSTC", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "12558", nome: "Diego S. A.", nomeCompleto: "Diego Santos Alencar", gerencia: "GERE", base: "BCB", funcao: "Fiscal", meta: 2 },
  { matricula: "12471", nome: "Dyulijan", nomeCompleto: "Dyulijan Pereira de Oliveira", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "13516", nome: "Elismar", nomeCompleto: "Elismar Rocha de Sousa", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "13315", nome: "Everaldo", nomeCompleto: "Everaldo Nogueira Filho", gerencia: "GOMAN", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "12509", nome: "F. das Chagas", nomeCompleto: "Francisco das Chagas Pereira Lima", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "12570", nome: "Francisco F.", nomeCompleto: "Francisco Flavio Reis Gomes", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "12576", nome: "Gleyson", nomeCompleto: "Gleyson de Sousa Silva", gerencia: "GSTC", base: "BCB", funcao: "Fiscal", meta: 2 },
  { matricula: "13947", nome: "Isaac", nomeCompleto: "Isaac da Cunha Alves Silva", gerencia: "GERE", base: "BCB", funcao: "Fiscal", meta: 2 },
  { matricula: "12690", nome: "Italo B.", nomeCompleto: "Italo Bruno da Silva Fontes", gerencia: "GOMAN", base: "BCB", funcao: "Analista de Desempenho", meta: 2 },
  { matricula: "23972", nome: "J. Alef", nomeCompleto: "Joao Alef dos Santos Barbosa", gerencia: "GOMAN", base: "BCB", funcao: "Tec. De Planejamento De Produção", meta: 2 },
  { matricula: "12621", nome: "Jamerson", nomeCompleto: "Jamerson Ferreira de Miranda", gerencia: "GOMAN", base: "BCB", funcao: "Coordenador", meta: 2 },
  { matricula: "22025", nome: "Julio", nomeCompleto: "Julio Cesar de Souza Sangi", gerencia: "GERE", base: "BCB", funcao: "Coordenador", meta: 2 },
  { matricula: "12746", nome: "L. Filipe", nomeCompleto: "Luis Filipe Cantanhede Alves", gerencia: "GERE", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "12595", nome: "Lucas A.", nomeCompleto: "Lucas Alves de Almeida", gerencia: "GSTC", base: "BCB", funcao: "Fiscal", meta: 2 },
  { matricula: "16153", nome: "Lucas M.", nomeCompleto: "Lucas Moreira de Souza", gerencia: "OFICINA", base: "BCB", funcao: "Coordenador", meta: 2 },
  { matricula: "12597", nome: "M. Protasio", nomeCompleto: "Manoel da Silva Protasio", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "12672", nome: "Moises", nomeCompleto: "Moises Ferreira de Sousa", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "21574", nome: "Normam", nomeCompleto: "Normam Matheus Barros de Oliveira", gerencia: "SESMT", base: "BCB", funcao: "Sesmt", meta: 5 },
  { matricula: "12517", nome: "Ofelio", nomeCompleto: "Ofelio de Sousa Alves", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "12516", nome: "Pablo L.", nomeCompleto: "Pablo Silva Loura", gerencia: "GOMAN", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "12354", nome: "Pryscilla", nomeCompleto: "Pryscilla Cristyane Oliveira de Faria", gerencia: "ADM", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "13744", nome: "R. Ribeiro", nomeCompleto: "Raimundo Ribeiro da Silva Filho", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "12483", nome: "Renato Matos", nomeCompleto: "Renato Silva de Matos", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "14475", nome: "Ruan V.", nomeCompleto: "Ruan Valmir de Souza Silva", gerencia: "OFICINA", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "462", nome: "Salazar", nomeCompleto: "Antonio Marcos Salazar dos Reis", gerencia: "GERE", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "12513", nome: "Wanderson R.", nomeCompleto: "Wanderson Ribeiro Vale", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "12506", nome: "Werbeth", nomeCompleto: "Werbeth Rodrigues Carvalho", gerencia: "GOMAN", base: "BCB", funcao: "Supervisor", meta: 2 },
  { matricula: "12383", nome: "Weyderson", nomeCompleto: "Weyderson Juan da Costa Santos", gerencia: "ADM", base: "BCB", funcao: "Adm", meta: 2 },
  { matricula: "12530", nome: "Wilke", nomeCompleto: "Wilke", gerencia: "GOMAN", base: "BCB", funcao: "Encarregado", meta: 2 },
  { matricula: "20548", nome: "Anibio", nomeCompleto: "Anibio da Silva Taveira", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "13023", nome: "Bruno O.", nomeCompleto: "Bruno Oliveira da Silva", gerencia: "GSTC", base: "BDC", funcao: "Fiscal", meta: 2 },
  { matricula: "18311", nome: "Cleomar", nomeCompleto: "Cleomar Vieira da Silva", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "16938", nome: "Fernando C.", nomeCompleto: "Fernando da Conceicao Lima", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "17753", nome: "Idialdo", nomeCompleto: "Idialdo dos Santos Coimbra", gerencia: "GOMAN", base: "BDC", funcao: "Supervisor", meta: 2 },
  { matricula: "15565", nome: "Jackson", nomeCompleto: "Jackson Kentelly Marculino de Souza", gerencia: "SPOT", base: "BDC", funcao: "Adm", meta: 2 },
  { matricula: "12572", nome: "Jarbem", nomeCompleto: "Jarbem Rosa Sousa", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "13518", nome: "Jose F.", nomeCompleto: "Jose Francisco Rodrigues Batista", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "12851", nome: "Josiel M.", nomeCompleto: "Josiel Meneses dos Santos", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "12938", nome: "Lucas O.", nomeCompleto: "Lucas Oliveira Costa", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "16079", nome: "Mateus", nomeCompleto: "Mateus Davis de Oliveira Carneiro", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "21614", nome: "Nilo", nomeCompleto: "Nilo Goncalves da Silva Filho", gerencia: "SESMT", base: "BDC", funcao: "Sesmt", meta: 5 },
  { matricula: "22518", nome: "Roberto R.", nomeCompleto: "Roberto Ribeiro Santos", gerencia: "GOMAN", base: "BDC", funcao: "Encarregado", meta: 2 },
  { matricula: "15613", nome: "Arlan", nomeCompleto: "Arlan da Silva da Conceicao", gerencia: "GSTC", base: "ITM", funcao: "Fiscal", meta: 2 },
  { matricula: "12762", nome: "Cristophe", nomeCompleto: "Cristophe Daniel dos Santos Melo", gerencia: "GOMAN", base: "ITM", funcao: "Supervisor", meta: 2 },
  { matricula: "12751", nome: "Gilson R.", nomeCompleto: "Gilson Ricardo Silva Cunha", gerencia: "GOMAN", base: "ITM", funcao: "Encarregado", meta: 2 },
  { matricula: "4745", nome: "Hittalo M.", nomeCompleto: "Hittalo Moraes da Silva", gerencia: "GOMAN", base: "ITM", funcao: "Tec. De Planejamento De Produção", meta: 2 },
  { matricula: "12792", nome: "Ivanilson", nomeCompleto: "Ivanilson Ricardo Oliveira Santos", gerencia: "GOMAN", base: "ITM", funcao: "Encarregado", meta: 2 },
  { matricula: "12686", nome: "J. Raimundo C. F", nomeCompleto: "Jose Raimundo Costa Filho", gerencia: "GOMAN", base: "ITM", funcao: "Encarregado", meta: 2 },
  { matricula: "12749", nome: "João Batista", nomeCompleto: "Joao Batista da Silva Chagas", gerencia: "GOMAN", base: "ITM", funcao: "Tec. De Planejamento De Produção", meta: 2 },
  { matricula: "12800", nome: "Leonardo E.", nomeCompleto: "Leonardo Estrela Anchieta", gerencia: "GSTC", base: "ITM", funcao: "Supervisor", meta: 2 },
  { matricula: "12724", nome: "R. Matos", nomeCompleto: "Raimundo Nonato Sousa Matos", gerencia: "GSTC", base: "ITM", funcao: "Fiscal", meta: 2 },
  { matricula: "12745", nome: "Washington S.", nomeCompleto: "Washington Soares de Souza", gerencia: "GSTC", base: "ITM", funcao: "Fiscal", meta: 2 },
  { matricula: "21925", nome: "Welrisson", nomeCompleto: "Welrisson Oliveira Sousa", gerencia: "SESMT", base: "ITM", funcao: "Sesmt", meta: 5 },
  { matricula: "20868", nome: "Alex M.", nomeCompleto: "Alex Machado da Silva", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "12884", nome: "Beneth E.", nomeCompleto: "Beneth Erikson Santos Cavalcante", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "14983", nome: "Candido", nomeCompleto: "Candido Gabriel de Melo Silva Soares", gerencia: "GOMAN", base: "PDS", funcao: "Tec. De Planejamento De Produção", meta: 2 },
  { matricula: "13035", nome: "Climaco", nomeCompleto: "Joao Climaco Medeiros de Azevedo Junior", gerencia: "GOMAN", base: "PDS", funcao: "Supervisor", meta: 2 },
  { matricula: "12813", nome: "Everton S.", nomeCompleto: "Everton Siqueira Pereira", gerencia: "SESMT", base: "PDS", funcao: "Supervisor", meta: 5 },
  { matricula: "13748", nome: "F. Melo", nomeCompleto: "Fernando Melo da Costa", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "12820", nome: "J. Airton", nomeCompleto: "Jose Airton do Carmo Melo Filho", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "12822", nome: "Janes C.", nomeCompleto: "Janes da Costa Melo", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "16331", nome: "Josielington", nomeCompleto: "Josielington Paz de Oliveira", gerencia: "SESMT", base: "PDS", funcao: "Sesmt", meta: 5 },
  { matricula: "12848", nome: "Manuel Jr.", nomeCompleto: "Manuel Silva Junior", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "12818", nome: "Messias", nomeCompleto: "Messias Abreu dos Santos", gerencia: "GOMAN", base: "PDS", funcao: "Supervisor", meta: 2 },
  { matricula: "12852", nome: "Patrick A.", nomeCompleto: "Patrick Amaro Ferreira", gerencia: "GOMAN", base: "PDS", funcao: "Tec. De Planejamento De Produção", meta: 2 },
  { matricula: "12842", nome: "R. Hermesson", nomeCompleto: "Raimundo Hermesson Brito Vieira da Silva", gerencia: "GSTC", base: "PDS", funcao: "Supervisor", meta: 2 },
  { matricula: "12882", nome: "R. Nonato", nomeCompleto: "Raimundo Nonato da Costa Filho", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "12844", nome: "Reinaldo", nomeCompleto: "Reinaldo Santana de Lima", gerencia: "GSTC", base: "PDS", funcao: "Fiscal", meta: 2 },
  { matricula: "16138", nome: "Thomas", nomeCompleto: "Thomas Lucas da Silva Lima", gerencia: "GERE", base: "PDS", funcao: "Fiscal", meta: 2 },
  { matricula: "12849", nome: "Valdei O.", nomeCompleto: "Valdei Oliveira Silva", gerencia: "GOMAN", base: "PDS", funcao: "Encarregado", meta: 2 },
  { matricula: "17751", nome: "Vanilson", nomeCompleto: "Vanilson Siqueira Furtado", gerencia: "GSTC", base: "PDS", funcao: "Fiscal", meta: 2 },
  { matricula: "22899", nome: "A. Conceição", nomeCompleto: "Antonio da Conceicao Silva Neto", gerencia: "GSTC", base: "PDT", funcao: "Fiscal", meta: 2 },
  { matricula: "12891", nome: "A. S. de Abreu", nomeCompleto: "Antonio Silva de Abreu", gerencia: "SESMT", base: "PDT", funcao: "Supervisor", meta: 5 },
  { matricula: "12489", nome: "A. Samuel", nomeCompleto: "Antonio Samuel Silva Viana", gerencia: "GSTC", base: "PDT", funcao: "Fiscal", meta: 2 },
  { matricula: "21141", nome: "Andre S.", nomeCompleto: "Andre Silva de Sousa", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "13009", nome: "Ariosvaldo", nomeCompleto: "Ariosvaldo Alves Soares", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "12913", nome: "Augusto C.", nomeCompleto: "Augusto Cesar da Silva", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "12898", nome: "C. Sandro", nomeCompleto: "Carlos Sandro da Silva Florencio", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "19837", nome: "Camila", nomeCompleto: "Camila Correa Araujo", gerencia: "ADM", base: "PDT", funcao: "Coordenador", meta: 2 },
  { matricula: "17747", nome: "Daciel", nomeCompleto: "Daciel Pereira Ramos", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "21607", nome: "Dario", nomeCompleto: "Dario Franca Fernandes de Sousa", gerencia: "SESMT", base: "PDT", funcao: "Sesmt", meta: 5 },
  { matricula: "24046", nome: "Davi", nomeCompleto: "Davi Cabral Santos", gerencia: "GOMAN", base: "PDT", funcao: "Tec. De Planejamento De Produção", meta: 2 },
  { matricula: "24088", nome: "Edivaldo", nomeCompleto: "Edivaldo Silva do Nascimento", gerencia: "GSTC", base: "PDT", funcao: "Fiscal", meta: 2 },
  { matricula: "13818", nome: "Edson", nomeCompleto: "Edson de Souza Pereira", gerencia: "GERE", base: "PDT", funcao: "Fiscal", meta: 2 },
  { matricula: "12892", nome: "F. de Assis", nomeCompleto: "Francisco de Assis Araujo Rodrigues", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "12939", nome: "Gabriel", nomeCompleto: "Gabriel do Carmo Costa", gerencia: "GOMAN", base: "PDT", funcao: "Tec. De Planejamento De Produção", meta: 2 },
  { matricula: "12998", nome: "Guilherme F.", nomeCompleto: "Guilherme Fonseca de Sousa Nogueira", gerencia: "GSTC", base: "PDT", funcao: "Fiscal", meta: 2 },
  { matricula: "12955", nome: "Maicon", nomeCompleto: "Maicon Douglas Silva Alves", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "17463", nome: "Marcirio", nomeCompleto: "Marcirio Cesar Viana da Silva Neto", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "12981", nome: "Marcus V.", nomeCompleto: "Marcus Vinicius Soares Lima", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "12847", nome: "Paulo", nomeCompleto: "Paulo Silva Ferreira", gerencia: "GSTC", base: "PDT", funcao: "Fiscal", meta: 2 },
  { matricula: "19571", nome: "Paulo P.", nomeCompleto: "Paulo Pantoja", gerencia: "GOMAN", base: "PDT", funcao: "Tec. De Planejamento De Produção", meta: 2 },
  { matricula: "24109", nome: "Rafael P.", nomeCompleto: "Rafael Pereira da Silva", gerencia: "GOMAN", base: "PDT", funcao: "Tec. De Planejamento De Produção", meta: 2 },
  { matricula: "19677", nome: "Rafaela", nomeCompleto: "Rafaela", gerencia: "GOMAN", base: "PDT", funcao: "Coordenador", meta: 2 },
  { matricula: "12719", nome: "Raimundo N.", nomeCompleto: "Raimundo Nonato Almeida do Nascimento", gerencia: "GOMAN", base: "PDT", funcao: "Supervisor", meta: 2 },
  { matricula: "13021", nome: "Raurison", nomeCompleto: "Raurison Cardim Oliveira", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "12928", nome: "Vilson", nomeCompleto: "Vilson Alves Ferreira", gerencia: "GOMAN", base: "PDT", funcao: "Encarregado", meta: 2 },
  { matricula: "24036", nome: "Carlos R.", nomeCompleto: "Carlos Rodrigues Oliveira", gerencia: "SPOT", base: "STI", funcao: "Tec. De Planejamento De Produção", meta: 2 },
  { matricula: "12650", nome: "Diego Sousa", nomeCompleto: "Diego Sousa de Lima", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "14587", nome: "Edvan", nomeCompleto: "Edivan de Lima Carvalho", gerencia: "GOMAN", base: "STI", funcao: "Supervisor", meta: 2 },
  { matricula: "12534", nome: "Fabio M.", nomeCompleto: "Fabio Moraes de Sousa", gerencia: "GOMAN", base: "STI", funcao: "Fiscal", meta: 2 },
  { matricula: "23741", nome: "Francisco Jr.", nomeCompleto: "Francisco Junior Lima Fontenele", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "17084", nome: "Hugo L.", nomeCompleto: "Hugo Leonardo Vieira da Silveira", gerencia: "GERE", base: "STI", funcao: "Fiscal", meta: 2 },
  { matricula: "24793", nome: "J. Henrique", nomeCompleto: "Jose Henrique Melonio Costa", gerencia: "SESMT", base: "STI", funcao: "Sesmt", meta: 5 },
  { matricula: "13754", nome: "J. Pedro", nomeCompleto: "Jose Pedro Goncalves Moura", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "17462", nome: "João L.", nomeCompleto: "Joao Lucas Rodrigues Apoliano", gerencia: "SPOT", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "13410", nome: "Joel", nomeCompleto: "Joel Pereira de Araujo Filho", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "13073", nome: "Jorden C.", nomeCompleto: "Jorden Cleyson de Lucena Mota", gerencia: "GSTC", base: "STI", funcao: "Fiscal", meta: 2 },
  { matricula: "12742", nome: "Joselmo", nomeCompleto: "Joselmo Gomes dos Santos", gerencia: "SPOT", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "13100", nome: "Leonardo M.", nomeCompleto: "Leonardo Martins de Lima", gerencia: "GOMAN", base: "STI", funcao: "Tec. De Planejamento De Produção", meta: 2 },
  { matricula: "12515", nome: "Luis C.", nomeCompleto: "Luis Carlos de Souza", gerencia: "GOMAN", base: "STI", funcao: "Supervisor", meta: 2 },
  { matricula: "13099", nome: "M. Viegas", nomeCompleto: "Mateus Antonio Viegas Lima", gerencia: "GOMAN", base: "STI", funcao: "Tec. De Planejamento De Produção", meta: 2 },
  { matricula: "13077", nome: "Madson F.", nomeCompleto: "Madson Felix da Silva", gerencia: "SPOT", base: "STI", funcao: "Fiscal", meta: 2 },
  { matricula: "120", nome: "Manoel N.", nomeCompleto: "Manoel do Nascimento Pereira Rodrigues", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "15455", nome: "Marcos F.", nomeCompleto: "Marcos Felipe de Andrade Silva", gerencia: "SPOT", base: "STI", funcao: "Coordenador", meta: 2 },
  { matricula: "13080", nome: "Mikeias", nomeCompleto: "Mikeias Veloso Pinheiro", gerencia: "SPOT", base: "STI", funcao: "Supervisor", meta: 2 },
  { matricula: "17746", nome: "Moraniel", nomeCompleto: "Moraniel de Jesus Silva", gerencia: "SPOT", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "12467", nome: "P. Cesar", nomeCompleto: "Paulo Cesar Rodrigues Ferreira", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "12479", nome: "Renato R.", nomeCompleto: "Renato Ramos Carvalho", gerencia: "GSTC", base: "STI", funcao: "Fiscal", meta: 2 },
  { matricula: "13060", nome: "Rosiel F.", nomeCompleto: "Rosiel Ferreira dos Santos", gerencia: "GOMAN", base: "STI", funcao: "Encarregado", meta: 2 },
  { matricula: "16939", nome: "Silman", nomeCompleto: "Silman Mario Santos Lima", gerencia: "SPOT", base: "STI", funcao: "Encarregado", meta: 2 },
]

export const bases    = ["Todos", "BCB", "BDC", "ITM", "PDS", "PDT", "STI"]
export const gerencias = ["Todos", "ADM", "GERE", "GOMAN", "GSTC", "LOGISTICA", "OFICINA", "SESMT", "SPOT"]

let liveEmployees: Employee[] | null = null

export function setLiveEmployees(list: Employee[]) {
  liveEmployees = list.length ? list : null
}

export function observerList(): Employee[] {
  return liveEmployees ?? employees
}

export function findByMatricula(mat: string): Employee | undefined {
  const t = mat.trim()
  const compact = t.replace(/^0+/, "") || t
  return observerList().find((e) => {
    const m = e.matricula.trim()
    const mc = m.replace(/^0+/, "") || m
    return m.toLowerCase() === t.toLowerCase() || mc === compact
  })
}
