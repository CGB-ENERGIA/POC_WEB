import { ref } from "vue";
import { getSupabase } from "@/lib/supabase";

/**
 * Cronograma das semanas de observação, definido por mês no painel (Metas).
 * Semana 1 = dia 1 até fim[0]; 2 = fim[0]+1 até fim[1]; 3 = fim[1]+1 até fim[2]; 4 = o resto do mês.
 * Mês sem configuração usa o padrão antigo (8/15/22). Fica guardado no aparelho para funcionar sem internet.
 */
type Fims = [number, number, number];
const PADRAO: Fims = [8, 15, 22];
const STORAGE_KEY = "cgb-semanas-config";

const config = new Map<string, Fims>();
/** Muda quando o cronograma é atualizado; ler dentro de um computed faz a tela recalcular. */
export const semanasVersao = ref(0);

try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    for (const [k, v] of Object.entries(JSON.parse(raw) as Record<string, Fims>)) config.set(k, v);
  }
} catch {
  /* sem armazenamento: usa o padrão até conseguir baixar */
}

export function semanaDoDia(ano: number, mes: number, dia: number): 1 | 2 | 3 | 4 {
  void semanasVersao.value;
  const [a, b, c] = config.get(`${ano}-${mes}`) ?? PADRAO;
  if (dia <= a) return 1;
  if (dia <= b) return 2;
  if (dia <= c) return 3;
  return 4;
}

export async function carregarSemanas(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  try {
    const { data, error } = await getSupabase()
      .from("semanas_config" as never)
      .select("ano,mes,fim_s1,fim_s2,fim_s3");
    if (error || !data) return;
    config.clear();
    for (const r of data as unknown as { ano: number; mes: number; fim_s1: number; fim_s2: number; fim_s3: number }[]) {
      config.set(`${r.ano}-${r.mes}`, [r.fim_s1, r.fim_s2, r.fim_s3]);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(config)));
    } catch {
      /* sem espaço: segue só em memória */
    }
    semanasVersao.value++;
  } catch {
    /* sem rede: mantém o que já tinha */
  }
}
