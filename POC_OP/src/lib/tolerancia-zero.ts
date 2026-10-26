import { supabase } from "@/lib/supabase";
import type { ResponseRow } from "@/lib/dashboard";

/**
 * Tolerância Zero = não conformidade em uma das perguntas da lista oficial (tabela tolerancia_zero_perguntas,
 * carregada da planilha "PERGUNTAS - TOLERÂNCIA ZERO"). Vale para a página Tolerância Zero, o ICIT e o Dashboard.
 * A lista só diz QUAIS perguntas contam; a categoria mostrada é a do próprio checklist (a planilha põe algumas perguntas de EPI/EPC
 * em "Regras de Ouro", mas no checklist elas são de Procedimento). As etapas das Regras de Ouro contam item a item.
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

/** Nome da categoria com a mesma grafia em todo o painel ("PROCEDIMENTO" e "Procedimento" viram "Procedimento"). */
export function rotuloCategoria(categoria: string | null | undefined): string {
  const palavras = (categoria ?? "").trim().split(/\s+/).filter(Boolean);
  if (!palavras.length) return "Sem categoria";
  return palavras
    .map((w, i) => {
      const base = w.replace(/[^\p{L}]/gu, "").toLowerCase();
      if (["apr", "epi", "epc"].includes(base)) return w.toUpperCase();
      if (i > 0 && ["de", "e", "em", "da", "do", "das", "dos"].includes(base)) return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
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
          if (hit) out.push({ ...r, pergunta: hit.pergunta, categoria: "Regras de Ouro" });
        }
      } else {
        // registro sem o detalhe por etapa: conta uma ocorrência de Regras de Ouro
        out.push({ ...r, categoria: "Regras de Ouro" });
      }
      continue;
    }
    const hit = mapa.get(chavePergunta(r.pergunta));
    if (hit) out.push({ ...r, pergunta: hit.pergunta, categoria: rotuloCategoria(r.categoria) });
  }
  return out;
}

const ORDEM_CATEGORIAS = ["APR", "Regras de Ouro", "Padrinho de Segurança", "Procedimento", "Trabalho em Altura"];

/** Categorias presentes nas ocorrências (para os botões de filtro): as principais na ordem de sempre, depois as demais. */
export function categoriasDasOcorrencias(ocorrencias: { categoria: string }[]): string[] {
  const presentes = new Set(ocorrencias.map((o) => o.categoria));
  const principais = ORDEM_CATEGORIAS.filter((c) => presentes.has(c));
  const outras = [...presentes].filter((c) => !ORDEM_CATEGORIAS.includes(c)).sort((a, b) => a.localeCompare(b, "pt-BR"));
  return [...principais, ...outras];
}
