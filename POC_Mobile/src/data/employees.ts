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
    funcao.includes("segurança") ||
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
  // ── LDP ──────────────────────────────────────────────────────────────────
  { matricula: "MA-LDP-A001", nome: "A. Samuel",     nomeCompleto: "Antônio Samuel Carvalho",   gerencia: "GOMAN",   base: "LDP",   funcao: "Operador",    meta: 4 },
  { matricula: "MA-LDP-A002", nome: "Adalton",        nomeCompleto: "Adalton Pereira Santos",    gerencia: "GOMAN",   base: "LDP",   funcao: "Técnico",     meta: 4 },
  { matricula: "MA-LDP-A003", nome: "Arilson",        nomeCompleto: "Arilson Santos Lima",       gerencia: "GOMAN",   base: "LDP",   funcao: "Operador",    meta: 4 },
  { matricula: "MA-LDP-D001", nome: "Deilton",        nomeCompleto: "Deilton Costa Ferreira",    gerencia: "GOMAN",   base: "LDP",   funcao: "Supervisor",  meta: 4 },
  { matricula: "MA-LDP-D001M",nome: "Deilton C.",     nomeCompleto: "Deilton C. Ferreira",       gerencia: "GOMAN",   base: "LDP",   funcao: "Supervisor",  meta: 4 },
  { matricula: "MA-LDP-E001", nome: "Emanuel",        nomeCompleto: "Emanuel Lima Andrade",      gerencia: "GOMAN",   base: "LDP",   funcao: "Operador",    meta: 4 },
  { matricula: "MA-LDP-G001", nome: "Gleyson",        nomeCompleto: "Gleyson Sousa Melo",        gerencia: "GOMAN",   base: "LDP",   funcao: "Técnico",     meta: 4 },
  { matricula: "MA-LDP-J001", nome: "Jamerson",       nomeCompleto: "Jamerson Pereira Alves",    gerencia: "GOMAN",   base: "LDP",   funcao: "Operador",    meta: 4 },
  { matricula: "MA-LDP-L001", nome: "Leonardo E.",    nomeCompleto: "Leonardo Evangelista Silva", gerencia: "GOMAN",   base: "LDP",   funcao: "Operador",    meta: 4 },
  { matricula: "MA-LDP-M001", nome: "Madson F.",      nomeCompleto: "Madson Fontenele Oliveira",  gerencia: "GOMAN",   base: "LDP",   funcao: "Técnico",     meta: 4 },
  { matricula: "MA-LDP-P001", nome: "Paulo",          nomeCompleto: "Paulo Henrique Souza",       gerencia: "GOMAN",   base: "LDP",   funcao: "Supervisor",  meta: 4 },
  { matricula: "MA-LDP-R001", nome: "R.Hermesson",   nomeCompleto: "Rodrigo Hermesson Barros",   gerencia: "GOMAN",   base: "LDP",   funcao: "Operador",    meta: 4 },
  { matricula: "MA-LDP-R002", nome: "R.Matos",       nomeCompleto: "Raimundo Matos Ferreira",    gerencia: "GOMAN",   base: "LDP",   funcao: "Operador",    meta: 4 },
  { matricula: "MA-LDP-R003", nome: "Reinaldo",       nomeCompleto: "Reinaldo Mendes Costa",      gerencia: "GOMAN",   base: "LDP",   funcao: "Técnico",     meta: 4 },
  { matricula: "MA-LDP-V001", nome: "Vanilson",       nomeCompleto: "Vanilson Rodrigues Sousa",   gerencia: "GOMAN",   base: "LDP",   funcao: "Operador",    meta: 4 },
  { matricula: "MA-LDP-W001", nome: "Washington S.",  nomeCompleto: "Washington Santos Carvalho", gerencia: "GOMAN",   base: "LDP",   funcao: "Supervisor",  meta: 4 },
  { matricula: "MA-LDP-C001M",nome: "Josielington",   nomeCompleto: "Josielington Araújo",        gerencia: "GOMAN",   base: "LDP",   funcao: "Técnico",     meta: 4 },
  { matricula: "MA-LDP-C002M",nome: "Jadilson",       nomeCompleto: "Jadilson Carvalho Pires",    gerencia: "GOMAN",   base: "LDP",   funcao: "Operador",    meta: 4 },
  // ── GTC ──────────────────────────────────────────────────────────────────
  { matricula: "MA-GTC-F001", nome: "Fabio L.",       nomeCompleto: "Fabio Lopes Ferreira",       gerencia: "GSTC",    base: "GTC",   funcao: "Técnico",     meta: 4 },
  { matricula: "MA-GTC-G001", nome: "Guilherme F.",   nomeCompleto: "Guilherme Ferreira Alves",   gerencia: "GSTC",    base: "GTC",   funcao: "Operador",    meta: 4 },
  { matricula: "MA-GTC-J001", nome: "Jordon C.",      nomeCompleto: "Jordon Cavalcante Ramos",    gerencia: "GSTC",    base: "GTC",   funcao: "Supervisor",  meta: 4 },
  { matricula: "MA-GTC-V001", nome: "Vanilson",       nomeCompleto: "Vanilson Gomes Lima",        gerencia: "GSTC",    base: "GTC",   funcao: "Operador",    meta: 4 },
  // ── MRA ──────────────────────────────────────────────────────────────────
  { matricula: "MA-MRA-E001M",nome: "Leandro",        nomeCompleto: "Leandro Prado Araújo",       gerencia: "OFICINA", base: "MRA",   funcao: "Técnico",     meta: 4 },
  { matricula: "MA-MRA-J001", nome: "Josué",          nomeCompleto: "Josué Santos Almeida",       gerencia: "OFICINA", base: "MRA",   funcao: "Operador",    meta: 4 },
  // ── ADM / SESMT ──────────────────────────────────────────────────────────
  { matricula: "MA-ADM-V001", nome: "Valcir",         nomeCompleto: "Valcir Andrade Nascimento",  gerencia: "ADM",     base: "SEDE",  funcao: "Coord. HSE",  meta: 8 },
  { matricula: "MA-SST-A001", nome: "Ana Paula",      nomeCompleto: "Ana Paula Rodrigues",        gerencia: "SESMT",   base: "SEDE",  funcao: "Técnica HSE", meta: 6 },
]

export function findByMatricula(mat: string): Employee | undefined {
  return employees.find(
    e => e.matricula.toLowerCase() === mat.trim().toLowerCase()
  )
}

export const bases    = ["Todos", "LDP", "GTC", "MRA", "SEDE"]
export const gerencias = ["Todos", "GOMAN", "GSTC", "OFICINA", "ADM", "SESMT", "GERE"]
