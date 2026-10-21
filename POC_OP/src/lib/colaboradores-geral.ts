import { FUNCIONARIOS, type Funcionario } from "@/data/funcionarios";
import { supabase } from "@/lib/supabase";
import { allPages } from "@/lib/dashboard";

export interface ColaboradorSugestao {
  nome: string;
  matricula: string;
  funcao: string;
  base: string;
}

let cache: Promise<ColaboradorSugestao[]> | null = null;

function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function chaveMatricula(m: string): string {
  return m.replace(/^0+/, "") || m;
}

/** Banco geral de colaboradores (tabela pwa_colaboradores); se estiver vazio ou falhar, usa a lista que vai junto com o app. */
export function carregarColaboradores(): Promise<ColaboradorSugestao[]> {
  cache ??= (async () => {
    let lista: Funcionario[] = [];
    try {
      lista = await allPages<Funcionario>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => (supabase.from("pwa_colaboradores" as never) as any).select("chapa,nome,funcao,base"),
        "chapa",
      );
    } catch { /* usa a lista embutida */ }
    if (lista.length < 100 && lista.length < FUNCIONARIOS.length) lista = FUNCIONARIOS;
    return lista.map((f) => ({ nome: f.nome, matricula: f.chapa, funcao: f.funcao ?? "", base: f.base ?? "" }));
  })();
  return cache;
}

/** Colaboradores cujo nome ou matrícula contém o texto digitado (sem diferenciar maiúsculas nem acentos). */
export function sugerirColaboradores(lista: ColaboradorSugestao[], texto: string, limite = 8): ColaboradorSugestao[] {
  const raw = texto.trim();
  if (raw.length < 2) return [];
  const q = fold(raw);
  const digitos = /^\d+$/.test(raw);
  const vistos = new Set<string>();
  const out: ColaboradorSugestao[] = [];
  for (const c of lista) {
    const bate = digitos ? chaveMatricula(c.matricula).startsWith(chaveMatricula(raw)) : fold(c.nome).includes(q);
    if (!bate) continue;
    const k = chaveMatricula(c.matricula);
    if (vistos.has(k)) continue;
    vistos.add(k);
    out.push(c);
    if (out.length >= limite) break;
  }
  return out;
}
