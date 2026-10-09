import { ref } from "vue";
import { supabase } from "./supabase";

/** Data/hora (ISO) da última validação feita em Validação (checklists ou resoluções); null se nunca houve. */
export const ultimaValidacao = ref<string | null>(null);

async function maisRecente(tabela: "checklist_submissions" | "nc_resolucoes"): Promise<string | null> {
  const { data, error } = await supabase
    .from(tabela)
    .select("data_analise")
    .not("data_analise", "is", null)
    .order("data_analise", { ascending: false })
    .limit(1);
  if (error || !data?.length) return null;
  return (data[0] as { data_analise: string | null }).data_analise;
}

export async function carregarUltimaValidacao(): Promise<void> {
  try {
    const [a, b] = await Promise.all([maisRecente("checklist_submissions"), maisRecente("nc_resolucoes")]);
    const datas = [a, b].filter((d): d is string => !!d).sort();
    ultimaValidacao.value = datas.length ? datas[datas.length - 1]! : null;
  } catch {
    /* sem rede: mantém o que já tinha */
  }
}

/** Ex.: "09/10/2026 às 14:03" (horário de Brasília). */
export function formatarValidacao(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const data = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const hora = d.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
  return `${data} às ${hora}`;
}
