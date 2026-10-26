import { computed, shallowRef, type Ref } from "vue";
import {
  fetchHierarquiaEquipes,
  hierarquiaDaEquipe,
  foldName,
  chaveEquipe,
  type EmployeeRow,
  type EquipeHier,
} from "@/lib/dashboard";
import { valores } from "@/lib/multi-filtro";

export { chaveEquipe };

type SubEquipe = { auditagem?: string | null; equipe?: string | null; base?: string | null };

/**
 * Coordenador, gerente, gerência e base pela EQUIPE do checklist (as equipes vinculadas a quem se escolheu no filtro),
 * não pelo cadastro de quem observou. Fonte: cadastro de equipes (pwa_equipes) + histórico de coordenação.
 */
export function useHierarquiaEquipe(employees: Ref<EmployeeRow[]>) {
  const hierEquipes = shallowRef(new Map<string, EquipeHier>());
  fetchHierarquiaEquipes().then((m) => { hierEquipes.value = m; });

  /** Coordenadores que têm equipe vinculada (sem repetir "AFONSO"/"Afonso"), com "Todos" no início. */
  const coordenadoresOpts = computed(() => {
    const nomes = new Map<string, string>();
    for (const h of hierEquipes.value.values()) {
      const nome = h.coordenador.trim();
      const k = foldName(nome);
      if (!k) continue;
      const atual = nomes.get(k);
      if (!atual || (atual === atual.toUpperCase() && nome !== nome.toUpperCase())) nomes.set(k, nome);
    }
    return ["Todos", ...[...nomes.values()].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }))];
  });

  /** Gerente de cada coordenador (o mais comum no cadastro), para equipes sem gerente informado. */
  const gerenteDoCoordenador = computed(() => {
    const cont = new Map<string, Map<string, number>>();
    for (const e of employees.value) {
      const c = foldName(e.coordenador ?? "");
      const g = (e.gerente ?? "").trim();
      if (!c || !g) continue;
      const m = cont.get(c) ?? new Map<string, number>();
      m.set(g, (m.get(g) ?? 0) + 1);
      cont.set(c, m);
    }
    const out = new Map<string, string>();
    for (const [c, m] of cont) out.set(c, [...m.entries()].sort((a, b) => b[1] - a[1])[0]![0]);
    return out;
  });

  const gerenciaDaSub = (sub: SubEquipe): string =>
    (hierarquiaDaEquipe(hierEquipes.value, sub.equipe ?? "")?.gerencia || sub.auditagem || "").toUpperCase();

  const baseDaSub = (sub: SubEquipe): string =>
    (hierarquiaDaEquipe(hierEquipes.value, sub.equipe ?? "")?.base || sub.base || "").toUpperCase();

  /** Coordenador e gerente escolhidos (um ou vários, ver multi-filtro): a equipe do checklist precisa pertencer a algum deles. */
  function passaCoordenadorGerente(sub: SubEquipe, coordenador: string, gerente: string): boolean {
    const coords = valores(coordenador);
    const gerentes = valores(gerente);
    if (!coords.length && !gerentes.length) return true;
    const h = hierarquiaDaEquipe(hierEquipes.value, sub.equipe ?? "");
    const coordDaEquipe = foldName(h?.coordenador ?? "");
    if (coords.length && !coords.some((c) => foldName(c) === coordDaEquipe)) return false;
    if (gerentes.length) {
      const g = foldName(h?.gerente || gerenteDoCoordenador.value.get(coordDaEquipe) || "");
      if (!gerentes.some((x) => foldName(x) === g)) return false;
    }
    return true;
  }

  return { hierEquipes, coordenadoresOpts, gerenciaDaSub, baseDaSub, passaCoordenadorGerente };
}
