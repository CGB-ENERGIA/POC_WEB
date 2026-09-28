import { LocalStorage } from "quasar";
import { getSupabase } from "@/lib/supabase";
import { isSupabaseSyncEnabled } from "@/lib/config";
import {
  getMetaSemanal,
  setLiveEmployees,
  type Employee,
} from "@/data/employees";

const CACHE_KEY = "cgb-observers";

function fromCache(): Employee[] {
  const saved = LocalStorage.getItem<Employee[]>(CACHE_KEY);
  return Array.isArray(saved) && saved.length ? saved : [];
}

export async function refreshObservers(): Promise<void> {
  const cached = fromCache();
  if (cached.length) setLiveEmployees(cached);

  if (!isSupabaseSyncEnabled() || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return;
  }

  try {
    const { data, error } = await getSupabase()
      .from("employees")
      .select("matricula, nome, nome_completo, gerencia, base, funcao")
      .eq("ativo", true)
      .order("nome");
    if (error || !data?.length) return;

    const list: Employee[] = data.map((row) => ({
      matricula: row.matricula,
      nome: row.nome,
      nomeCompleto: row.nome_completo,
      gerencia: row.gerencia,
      base: row.base,
      funcao: row.funcao,
      meta: getMetaSemanal(row),
    }));
    setLiveEmployees(list);
    LocalStorage.set(CACHE_KEY, list);
  } catch {
    /* offline: seed/cache */
  }
}
