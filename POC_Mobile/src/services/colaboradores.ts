import { LocalStorage } from "quasar";
import { shallowRef } from "vue";
import { FUNCIONARIOS, type Funcionario } from "@/data/funcionarios";
import { getSupabase } from "@/lib/supabase";
import { isSupabaseSyncEnabled } from "@/lib/config";

const CACHE_KEY = "cgb-colaboradores-geral";

function loadCache(): Funcionario[] {
  const saved = LocalStorage.getItem<Funcionario[]>(CACHE_KEY);
  if (Array.isArray(saved) && saved.length) return saved;
  return FUNCIONARIOS;
}

/** Fonte única da busca de membros: cache local, depois o banco geral no Supabase. */
export const colaboradoresGeral = shallowRef<Funcionario[]>(loadCache());

export async function refreshColaboradoresGeral(): Promise<void> {
  if (!isSupabaseSyncEnabled() || !navigator.onLine) return;
  try {
    const { data, error } = await getSupabase()
      .from("pwa_colaboradores" as never)
      .select("chapa,nome,funcao,base,rateio")
      .order("nome");
    if (error || !data?.length) return;
    if (data.length < 100 && data.length < FUNCIONARIOS.length) return;
    const list = data as Funcionario[];
    colaboradoresGeral.value = list;
    LocalStorage.set(CACHE_KEY, list);
  } catch {
    /* offline ou tabela ainda vazia: mantém XLS/cache */
  }
}
