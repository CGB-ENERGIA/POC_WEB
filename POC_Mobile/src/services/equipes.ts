import { LocalStorage } from "quasar";
import { EQUIPES, aplicarEquipesRemotas, type Equipe } from "@/data/equipes";
import { getSupabase } from "@/lib/supabase";
import { isSupabaseSyncEnabled } from "@/lib/config";

const CACHE_KEY = "cgb-equipes-pwa";

function loadCache(): Equipe[] {
  const saved = LocalStorage.getItem<Equipe[]>(CACHE_KEY);
  if (Array.isArray(saved) && saved.length) return saved;
  return EQUIPES;
}

aplicarEquipesRemotas(loadCache());

export async function refreshEquipesPwa(): Promise<void> {
  if (!isSupabaseSyncEnabled() || !navigator.onLine) return;
  try {
    const { data, error } = await getSupabase()
      .from("pwa_equipes" as never)
      .select("prefixo,base,gerencia,coordenador,gerente")
      .order("prefixo");
    if (error || !data?.length) return;
    const list = data as Equipe[];
    aplicarEquipesRemotas(list);
    LocalStorage.set(CACHE_KEY, list);
  } catch {
    /* offline: mantém planilha/cache */
  }
}
