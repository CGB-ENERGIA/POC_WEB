import { supabase } from "@/lib/supabase";
import type { ResponseRow } from "@/lib/dashboard";

/**
 * Tolerância Zero = não conformidade em uma das perguntas da lista oficial (tabela tolerancia_zero_perguntas,
 * carregada da planilha "PERGUNTAS - TOLERÂNCIA ZERO"). Vale para a página Tolerância Zero, o ICIT e o Dashboard.
 * A categoria mostrada é a da lista (não a do checklist), e as etapas das Regras de Ouro contam item a item.
 */

export interface PerguntaTz {
  pergunta: string;
  categoria: string;
}

export type MapaTz = Map<string, PerguntaTz>;

/** Só letras e números, minúsculo e sem acento: "( laudos" e "(laudos", ou um "?" a mais, casam. */
export function chavePergunta(texto: string | null | undefined): string {
  return (texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

let cache: Promise<MapaTz> | null = null;

/** Lista de perguntas de tolerância zero ativas (carrega uma vez por sessão; force=true recarrega). */
export function carregarPerguntasTz(force = false): Promise<MapaTz> {
  if (!cache || force) {
    cache = (async () => {
      const { data, error } = await supabase
        .from("tolerancia_zero_perguntas" as never)
        .select("chave,pergunta,categoria")
        .eq("ativo", true);
      if (error) throw error;
      const mapa: MapaTz = new Map();
      for (const r of (data ?? []) as unknown as { chave: string; pergunta: string; categoria: string }[]) {
        mapa.set(r.chave, { pergunta: r.pergunta, categoria: r.categoria });
      }
      return mapa;
    })().catch((e) => {
      cache = null; // tenta de novo na próxima vez
      throw e;
    });
  }
  return cache;
}

const REGRAS_DE_OURO = new Set(["goman-012", "gstc-021"]);
const etapaRegraDeOuro = (nome: string) => `Cumpriu a etapa da Regra de Ouro: ${nome.trim().toUpperCase()}?`;

/**
 * Ocorrências de tolerância zero entre as respostas: cada não conformidade de uma pergunta da lista vira uma ocorrência,
 * já com a pergunta e a categoria da lista. Regras de Ouro: uma ocorrência por etapa não cumprida.
 */
export function ocorrenciasTz(respostas: ResponseRow[], mapa: MapaTz): ResponseRow[] {
  if (!mapa.size) return [];
  const out: ResponseRow[] = [];
  for (const r of respostas) {
    if (r.resposta !== "nao_conforme") continue;
    if (REGRAS_DE_OURO.has(r.pergunta_id)) {
      if (r.itens?.length) {
        for (const it of r.itens) {
          if (it.conforme) continue;
          const hit = mapa.get(chavePergunta(etapaRegraDeOuro(it.nome)));
          if (hit) out.push({ ...r, pergunta: hit.pergunta, categoria: hit.categoria });
        }
      } else {
        // registro sem o detalhe por etapa: conta uma ocorrência de Regras de Ouro
        out.push({ ...r, categoria: "Regras de Ouro" });
      }
      continue;
    }
    const hit = mapa.get(chavePergunta(r.pergunta));
    if (hit) out.push({ ...r, pergunta: hit.pergunta, categoria: hit.categoria });
  }
  return out;
}

/** Categorias da lista, na ordem em que aparecem (para os botões de filtro). */
export function categoriasTz(mapa: MapaTz): string[] {
  return [...new Set([...mapa.values()].map((p) => p.categoria))];
}
