export interface Funcionario {
  nome: string;
  chapa: string;
  rateio: string;
  funcao: string;
  base: string;
}

// Arquivo gerado automaticamente a partir de geral.xls
// Execute o script Python para popular este arquivo com os 1065 colaboradores ativos
export const FUNCIONARIOS: Funcionario[] = [];

export function funcionariosPorBase(base: string): Funcionario[] {
  return base ? FUNCIONARIOS.filter((f) => f.base === base) : FUNCIONARIOS;
}
