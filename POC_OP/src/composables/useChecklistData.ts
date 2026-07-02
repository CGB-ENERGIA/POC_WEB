import { ref, computed, type Ref } from "vue";
import {
  fetchSubmissions,
  fetchResponses,
  fetchEmployees,
  countByObservador,
  countByBase,
  countBySemana,
  countByMes,
  conformidadePorCategoria,
  ncPorGravidade,
  type Filters,
  type SubmissionRow,
  type ResponseRow,
  type EmployeeRow,
} from "@/lib/dashboard";

export type { Filters, SubmissionRow, ResponseRow, EmployeeRow };

export function useChecklistData() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const submissions = ref<SubmissionRow[]>([]);
  const responses = ref<ResponseRow[]>([]);
  const employees = ref<EmployeeRow[]>([]);
  // Submissions for full year (line chart / heatmap without month filter)
  const submissionsAno = ref<SubmissionRow[]>([]);

  async function load(filters: Filters, loadYear = false, usarSemana = false) {
    loading.value = true;
    error.value = null;
    try {
      const [subs, emps] = await Promise.all([
        fetchSubmissions(filters, usarSemana),
        employees.value.length ? Promise.resolve(employees.value) : fetchEmployees(),
      ]);
      submissions.value = subs;
      employees.value = emps as EmployeeRow[];

      const resp = await fetchResponses(subs.map((s) => s.id));
      responses.value = resp;

      if (loadYear && filters.mes) {
        const yearSubs = await fetchSubmissions({ ano: filters.ano });
        submissionsAno.value = yearSubs;
      } else if (loadYear) {
        submissionsAno.value = subs;
      }
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  // ── Computed agregações ────────────────────────────────────────────────────

  const totalSubmissions = computed(() => submissions.value.length);
  const totalRespostas = computed(() => responses.value.length);
  const totalConformes = computed(
    () => responses.value.filter((r) => r.resposta === "conforme").length,
  );
  const totalNaoConformes = computed(
    () => responses.value.filter((r) => r.resposta === "nao_conforme").length,
  );
  const conformidadeIndex = computed(() =>
    totalRespostas.value ? totalConformes.value / totalRespostas.value : 0,
  );

  const pctPerfeitas = computed(() => {
    const map: Record<string, boolean> = {};
    for (const r of responses.value) {
      if (!(r.submission_id in map)) map[r.submission_id] = true;
      if (r.resposta === "nao_conforme") map[r.submission_id] = false;
    }
    const vals = Object.values(map);
    return vals.length ? vals.filter(Boolean).length / vals.length : 0;
  });

  const toleranciaZero = computed(
    () =>
      responses.value.filter(
        (r) =>
          r.resposta === "nao_conforme" &&
          (r.gravidade === "tolerancia_zero" ||
            r.gravidade === "Tolerância Zero" ||
            r.peso >= 5),
      ).length,
  );

  const byBase = computed(() => countByBase(submissions.value));
  const basesCovertas = computed(() => Object.keys(byBase.value).length);
  const byMes = computed(() => countByMes(submissionsAno.value.length ? submissionsAno.value : submissions.value));
  const bySemana = computed(() => countBySemana(submissions.value));
  const byObservador = computed(() => countByObservador(submissions.value));
  const byCategoria = computed(() => conformidadePorCategoria(responses.value));
  const byGravidade = computed(() => ncPorGravidade(responses.value));

  const byGerencia = computed(() => {
    const map: Record<string, number> = {};
    for (const s of submissions.value) {
      const emp = employees.value.find((e) => e.matricula === s.matricula);
      const g = emp?.gerencia ?? s.auditagem;
      map[g] = (map[g] ?? 0) + 1;
    }
    return map;
  });

  /** Conformidade por observador: { matricula → { nome, total, conformes, pct } } */
  const conformidadePorObservador = computed(() => {
    const map: Record<string, { nome: string; total: number; conformes: number }> = {};
    for (const s of submissions.value) {
      if (!map[s.matricula])
        map[s.matricula] = { nome: s.observador, total: 0, conformes: 0 };
    }
    for (const r of responses.value) {
      const sub = submissions.value.find((s) => s.id === r.submission_id);
      if (!sub) continue;
      if (!map[sub.matricula]) map[sub.matricula] = { nome: sub.observador, total: 0, conformes: 0 };
      map[sub.matricula].total++;
      if (r.resposta === "conforme") map[sub.matricula].conformes++;
    }
    return Object.entries(map)
      .map(([matricula, d]) => ({
        matricula,
        nome: d.nome,
        totalObs: submissions.value.filter((s) => s.matricula === matricula).length,
        total: d.total,
        conformes: d.conformes,
        naoConformes: d.total - d.conformes,
        pct: d.total ? Math.round((d.conformes / d.total) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.pct - a.pct);
  });

  return {
    loading,
    error,
    submissions,
    responses,
    employees,
    submissionsAno,
    load,
    totalSubmissions,
    totalRespostas,
    totalConformes,
    totalNaoConformes,
    conformidadeIndex,
    pctPerfeitas,
    toleranciaZero,
    byBase,
    basesCovertas,
    byMes,
    bySemana,
    byObservador,
    byCategoria,
    byGravidade,
    byGerencia,
    conformidadePorObservador,
  };
}

/** Formata número como porcentagem ex: 0.947 → "94,7%" */
export function fmtPct(v: number, casas = 1) {
  return (v * 100).toFixed(casas).replace(".", ",") + "%";
}

/** Formata inteiro grande ex: 1248 → "1.248" */
export function fmtN(n: number) {
  return n.toLocaleString("pt-BR");
}

/** Ref de filtros que é observável pelos componentes */
export function useFilters(initial: Filters): Ref<Filters> {
  return ref<Filters>({ ...initial }) as Ref<Filters>;
}
