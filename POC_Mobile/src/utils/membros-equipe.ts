import { observerList } from "@/data/employees";
import { colaboradoresGeral } from "@/services/colaboradores";

function fold(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function chaveMatricula(mat: string): string {
  return mat.replace(/^0+/, "") || mat;
}

/** Busca no banco geral (Supabase/cache/XLS) e no roster de observadores. */
export function sugerirMembrosEquipe(needle: string, limite = 12): string[] {
  const raw = needle.trim();
  if (!raw) return [];
  const q = fold(raw);
  const seen = new Set<string>();
  const out: string[] = [];

  const add = (nome: string, matricula: string) => {
    const key = chaveMatricula(matricula);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(`${nome} — ${matricula}`);
  };

  for (const f of colaboradoresGeral.value) {
    if (fold(f.nome).includes(q) || f.chapa.includes(raw)) add(f.nome, f.chapa);
    if (out.length >= limite) return out;
  }

  for (const e of observerList()) {
    if (
      fold(e.nomeCompleto).includes(q) ||
      fold(e.nome).includes(q) ||
      e.matricula.includes(raw)
    ) {
      add(e.nomeCompleto, e.matricula);
    }
    if (out.length >= limite) return out;
  }

  return out;
}

export function parseMembroSugestao(
  valor: string | null
): { nome: string; matricula: string } | null {
  if (!valor) return null;
  const sep = " — ";
  const i = valor.lastIndexOf(sep);
  if (i < 0) return null;
  const nome = valor.slice(0, i).trim();
  const matricula = valor.slice(i + sep.length).trim();
  if (!nome || !matricula) return null;
  return { nome, matricula };
}

export function rotuloMembro(membro: { nome: string; matricula: string }): string {
  const nome = membro.nome.trim();
  const mat = membro.matricula.trim();
  if (nome && mat) return `${nome} — ${mat}`;
  return nome || mat;
}
