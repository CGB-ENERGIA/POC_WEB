import { ref, shallowRef, computed, type Ref } from "vue";
import {
  fetchSubmissions,
  fetchResponses,
  fetchEmployees,
  uniqueHierarchyOpts,
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
import { carregarSemanas } from "@/lib/semanas";
import { carregarPerguntasTz, ocorrenciasTz, type MapaTz } from "@/lib/tolerancia-zero";

export type { Filters, SubmissionRow, ResponseRow, EmployeeRow };

export function useChecklistData() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  // shallowRef: milhares de linhas; ninguém altera os itens no lugar, só troca o array inteiro.
  const submissions = shallowRef<SubmissionRow[]>([]);
  const responses = shallowRef<ResponseRow[]>([]);
  const employees = shallowRef<EmployeeRow[]>([]);
  // Lista oficial de perguntas de tolerância zero (tabela tolerancia_zero_perguntas)
  const mapaTz = shallowRef<MapaTz>(new Map());
  carregarPerguntasTz()
    .then((m) => { mapaTz.value = m; })
    .catch((e) => { error.value = `Lista de tolerância zero indisponível: ${(e as Error).message}`; });

  // Submissions for full year (line chart / heatmap without month filter)
  const submissionsAno = shallowRef<SubmissionRow[]>([]);

  // Protege contra respostas obsoletas: se load() for chamado duas vezes,
  // apenas a mais recente atualiza o estado.
  let loadSeq = 0;

  /** respostas: "todas" (padrão), "nc" (só não conformes, para períodos longos) ou "nenhuma". */
  async function load(
    filters: Filters,
    loadYear = false,
    usarSemana = false,
    respostas: "todas" | "nc" | "nenhuma" = "todas",
  ) {
    const seq = ++loadSeq;
    loading.value = true;
    error.value = null;
    try {
      await carregarSemanas(); // consultas por semana dependem do cronograma do mês
      if (seq !== loadSeq) return;
      const [subs, emps] = await Promise.all([
        fetchSubmissions(filters, usarSemana),
        fetchEmployees(),
      ]);
      if (seq !== loadSeq) return;
      submissions.value = subs;
      employees.value = emps as EmployeeRow[];

      const resp = respostas === "nenhuma"
        ? []
        : await fetchResponses(subs.map((s) => s.id), { soNc: respostas === "nc" });
      if (seq !== loadSeq) return;
      responses.value = resp;

      if (loadYear && (filters.mes || filters.meses?.length)) {
        const yearSubs = await fetchSubmissions({ ano: filters.ano, ...(filters.contarMeta ? { contarMeta: true } : {}) });
        if (seq !== loadSeq) return;
        submissionsAno.value = yearSubs;
      } else if (loadYear) {
        submissionsAno.value = subs;
      }
    } catch (e) {
      if (seq === loadSeq) error.value = (e as Error).message;
    } finally {
      if (seq === loadSeq) loading.value = false;
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

  /** Ocorrências de tolerância zero: não conformidades das perguntas da lista oficial (tabela tolerancia_zero_perguntas). */
  const toleranciaZero = computed(() => ocorrenciasTz(responses.value, mapaTz.value).length);

  const byBase = computed(() => countByBase(submissions.value));
  const basesCovertas = computed(() => Object.keys(byBase.value).length);
  const byMes = computed(() => countByMes(submissionsAno.value.length ? submissionsAno.value : submissions.value));
  const bySemana = computed(() => countBySemana(submissions.value));
  const byObservador = computed(() => countByObservador(submissions.value));
  const byCategoria = computed(() => conformidadePorCategoria(responses.value));
  const byGravidade = computed(() => ncPorGravidade(responses.value));

  const gerentesOpts = computed(() => uniqueHierarchyOpts(employees.value, "gerente"));
  const coordenadoresOpts = computed(() => uniqueHierarchyOpts(employees.value, "coordenador"));

  const byGerencia = computed(() => {
    const map: Record<string, number> = {};
    const porMatricula = new Map(employees.value.map((e) => [e.matricula, e]));
    for (const s of submissions.value) {
      const emp = porMatricula.get(s.matricula);
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
    const subPorId = new Map(submissions.value.map((s) => [s.id, s]));
    for (const r of responses.value) {
      const sub = subPorId.get(r.submission_id);
      if (!sub) continue;
      if (!map[sub.matricula]) map[sub.matricula] = { nome: sub.observador, total: 0, conformes: 0 };
      map[sub.matricula]!.total++;
      if (r.resposta === "conforme") map[sub.matricula]!.conformes++;
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
    mapaTz,
    byBase,
    basesCovertas,
    byMes,
    bySemana,
    byObservador,
    byCategoria,
    byGravidade,
    byGerencia,
    gerentesOpts,
    coordenadoresOpts,
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
