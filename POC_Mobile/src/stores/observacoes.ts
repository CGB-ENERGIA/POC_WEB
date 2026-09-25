import { defineStore } from "pinia";
import { LocalStorage, Notify } from "quasar";

import type { AuditagemCategoria } from "@/data/auditagem";
import { findByMatricula, type Employee } from "@/data/employees";
import type { ChecklistResumo, ObservacaoChecklist, RespostaSalva } from "@/types/checklist";
import type { ItemVerificado } from "@/data/goman-checklist";
import { appConfig, isRemoteSyncEnabled, isSupabaseSyncEnabled } from "@/lib/config";
import {
  syncChecklistToRemote,
  syncEmAndamentoToRemote,
  deleteEmAndamentoFromRemote,
  fetchExistingClientIds,
} from "@/services/checklist-sync";
import { syncObservacaoLivreToRemote } from "@/services/observacao-sync";
import { refreshServerTimeSync } from "@/utils/server-time";
import { getSupabase } from "@/lib/supabase";
import { kvGet, kvSet } from "@/utils/offline-db";
import { useSessionStore } from "@/stores/session";

export type SyncStatus = "pending" | "synced" | "failed" | "local";

const STORAGE_KEY = "cgb-observacoes";
const IDB_KEY = "observacoes";
const RECONCILE_FLAG = "cgb-sync-reconciled-v1";
const DIA_MS = 24 * 60 * 60 * 1000;
/** Itens já enviados saem do aparelho após esse prazo (o servidor mantém tudo). */
const LOCAL_RETENTION_MS = 40 * DIA_MS;
const RECONCILE_WINDOW_MS = 7 * DIA_MS;
/** Até essa tentativa, falha de foto aborta o envio para não perder evidência. */
const MAX_ATTEMPTS_KEEP_PHOTOS = 3;

// Estado de runtime do motor de envio (fora do Pinia: não é reativo nem persistido).
let storageMode: "idb" | "local" = "local";
let writeChain: Promise<void> = Promise.resolve();
let localFallbackDirty = false;
let storageFullWarned = false;
let reconcileDone = false;
let queueRun: Promise<void> | null = null;
const inflight = new Map<string, Promise<boolean>>();

function plainCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isNetworkError(message: string | null | undefined): boolean {
  if (!message) return false;
  return /failed to fetch|load failed|networkerror|network request|sem conexão|timeout|aborted/i.test(message);
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (!navigator.onLine || isNetworkError(msg)) return "Sem conexão estável";
  return msg || "Erro desconhecido";
}

/** Backoff do reenvio periódico. Rede instável tenta logo; erro de servidor espaça mais. */
function nextAttemptDelay(attempts: number, networkIssue: boolean): number {
  const steps = networkIssue
    ? [15_000, 30_000, 60_000, 120_000]
    : [20_000, 60_000, 180_000, 600_000, 1_800_000];
  return steps[Math.min(attempts - 1, steps.length - 1)] ?? steps[steps.length - 1]!;
}

function resolveEmployee(matricula: string): Employee | null {
  const session = useSessionStore();
  if (session.employee?.matricula === matricula) return session.employee;
  return findByMatricula(matricula) ?? null;
}

function notifyStorageFull() {
  if (storageFullWarned) return;
  storageFullWarned = true;
  Notify.create({
    type: "negative",
    icon: "mdi-harddisk-remove",
    message: "Armazenamento do aparelho cheio. Conecte-se à internet para enviar os checklists pendentes e liberar espaço.",
    position: "top",
    timeout: 0,
    actions: [{ label: "OK", color: "white" }],
  });
}

function isQuotaExceeded(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED" || err.code === 22)
  );
}

/** Registro legado (formulário livre) — mantido para GSTC e registros antigos. */
export interface Observacao {
  id: string;
  matricula: string;
  observador: string;
  auditagem: AuditagemCategoria;
  data: string;
  base: string;
  equipe: string;
  categoria: string;
  item: string;
  tipo: "conforme" | "inconforme" | "feedback";
  severidade: string;
  descricao: string;
  resolvido: boolean;
}

export type RegistroObservacao = Observacao | ObservacaoChecklist;

interface ObservacoesState {
  items: RegistroObservacao[];
  syncedItems: ObservacaoChecklist[];
  hydrated: boolean;
  syncing: boolean;
  /** Última rodada da fila que enviou algo (para o indicador "Tudo enviado"). */
  lastSyncAt: number | null;
}

function loadItems(): RegistroObservacao[] {
  return LocalStorage.getItem<RegistroObservacao[]>(STORAGE_KEY) ?? [];
}

export function isChecklist(item: RegistroObservacao): item is ObservacaoChecklist {
  return "respostas" in item && Array.isArray(item.respostas);
}

/** Resolve a chave R2 (ou URL do Supabase Storage) salva em foto_r2_key para uma URL exibível. */
function resolveFotoUrl(key: string | null | undefined): string | undefined {
  if (!key) return undefined;
  if (key.startsWith("http")) return key;
  const base = appConfig.r2PublicBaseUrl;
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/${key}`;
}

/**
 * Busca as não conformidades (checklist_responses) dos itens sincronizados,
 * já que user_observations guarda só o resumo (total/conformes/naoConformes).
 * Retorna um mapa client_id (= id em user_observations) -> respostas nao_conforme.
 */
async function fetchNaoConformesParaItens(clientIds: string[]): Promise<Map<string, RespostaSalva[]>> {
  const result = new Map<string, RespostaSalva[]>();
  if (!clientIds.length) return result;
  const supabase = getSupabase();

  const { data: subs } = await supabase
    .from("checklist_submissions")
    .select("id,client_id")
    .in("client_id", clientIds);
  if (!subs?.length) return result;

  const subToClient = new Map<string, string>();
  for (const s of subs) if (s.client_id) subToClient.set(s.id, s.client_id);
  const subIds = subs.map((s) => s.id);

  const { data: resps } = await supabase
    .from("checklist_responses")
    .select("submission_id,pergunta_id,categoria,pergunta,gravidade,peso,resposta,observacao,foto_r2_key,resolvido,itens")
    .in("submission_id", subIds)
    .eq("resposta", "nao_conforme");
  if (!resps) return result;

  for (const r of resps) {
    const clientId = subToClient.get(r.submission_id);
    if (!clientId) continue;
    const list = result.get(clientId) ?? [];
    const foto = resolveFotoUrl(r.foto_r2_key);
    list.push({
      perguntaId: r.pergunta_id,
      categoria: r.categoria,
      pergunta: r.pergunta,
      gravidade: r.gravidade,
      peso: r.peso,
      resposta: "nao_conforme",
      ...(r.observacao ? { observacao: r.observacao } : {}),
      ...(foto ? { foto } : {}),
      ...(typeof r.resolvido === "boolean" ? { resolvido: r.resolvido } : {}),
      ...(r.itens ? { itens: r.itens as unknown as ItemVerificado[] } : {}),
    });
    result.set(clientId, list);
  }
  return result;
}

export const useObservacoesStore = defineStore("observacoes", {
  state: (): ObservacoesState => ({
    items: loadItems(),
    syncedItems: [],  // itens buscados do Supabase (user_observations)
    hydrated: false,
    syncing: false,
    lastSyncAt: null,
  }),

  getters: {
    byMatricula: (state) => (matricula: string) => {
      // Itens locais (todos: pending, failed, local e synced sem correspondente remoto ainda carregado)
      const localItems = state.items.filter((o) => o.matricula === matricula);

      // Enquanto syncedItems não foi carregado, inclui tudo do local para não zerar a contagem
      const syncedLoaded = state.syncedItems.length > 0;
      const localPending = syncedLoaded
        ? localItems.filter((o) => !isChecklist(o) || o.syncStatus !== "synced")
        : localItems;

      // Itens sincronizados do banco (últimos 35 dias)
      const synced = state.syncedItems.filter((o) => o.matricula === matricula);

      // Merge: locais primeiro, depois sincronizados sem duplicata
      const ids = new Set(localPending.map((o) => o.id));
      const merged = [
        ...localPending,
        ...synced.filter((o) => !ids.has(o.id)),
      ];

      return merged.sort((a, b) => b.data.localeCompare(a.data));
    },

    /** Checklists finalizados que ainda não chegaram ao servidor (todas as matrículas do aparelho). */
    queue: (state): ObservacaoChecklist[] =>
      state.items.filter(
        (o): o is ObservacaoChecklist =>
          isChecklist(o) && o.status !== "em_andamento" && o.syncStatus !== "synced"
      ),

    pendingCount(): number {
      return this.queue.length;
    },
  },

  actions: {
    /**
     * Carrega a fila do IndexedDB (cota de centenas de MB, contra ~5 MB do
     * localStorage, que estourava com 2–3 checklists com fotos offline).
     * Migra o que houver no localStorage e poda itens enviados há muito tempo.
     */
    async hydrate() {
      const fromLocal = this.items;
      try {
        const stored = await kvGet<RegistroObservacao[]>(IDB_KEY);
        const byId = new Map<string, RegistroObservacao>();
        for (const o of Array.isArray(stored) ? stored : []) byId.set(o.id, o);
        // localStorage só tem dados se é a 1ª execução ou se o IndexedDB falhou por último → é o mais recente.
        for (const o of fromLocal) byId.set(o.id, o);

        const limite = Date.now() - LOCAL_RETENTION_MS;
        this.items = [...byId.values()].filter(
          (o) => !(isChecklist(o) && o.syncStatus === "synced" && new Date(o.data).getTime() < limite)
        );

        await kvSet(IDB_KEY, plainCopy(this.items));
        storageMode = "idb";
        LocalStorage.remove(STORAGE_KEY);
      } catch {
        storageMode = "local";
      }
      this.hydrated = true;
    },

    persist() {
      const snapshot = plainCopy(this.items);
      if (storageMode === "idb") {
        writeChain = writeChain
          .then(() => kvSet(IDB_KEY, snapshot))
          .then(() => {
            if (localFallbackDirty) {
              LocalStorage.remove(STORAGE_KEY);
              localFallbackDirty = false;
            }
          })
          .catch(() => {
            localFallbackDirty = this.persistLocal(snapshot) || localFallbackDirty;
          });
        return;
      }
      this.persistLocal(snapshot);
    },

    /** Grava no localStorage. Retorna true se conseguiu. */
    persistLocal(snapshot: RegistroObservacao[]): boolean {
      try {
        LocalStorage.set(STORAGE_KEY, snapshot);
        return true;
      } catch (err) {
        if (!isQuotaExceeded(err)) return false;
        // Fotos base64 de checklists já enviados não precisam ocupar espaço local.
        if (this.freeSpaceForQuota()) {
          try {
            LocalStorage.set(STORAGE_KEY, plainCopy(this.items));
            return true;
          } catch {
            // ainda não coube
          }
        }
        notifyStorageFull();
        return false;
      }
    },

    /** Remove fotos locais (base64) de itens já sincronizados para liberar espaço no localStorage.
     *  Retorna true se algo foi removido (vale a pena tentar salvar de novo). */
    freeSpaceForQuota(): boolean {
      let freed = false;
      for (const item of this.items) {
        if (isChecklist(item) && item.syncStatus === "synced" && item.fotosLocal.length > 0) {
          item.fotosLocal = [];
          freed = true;
        }
      }
      return freed;
    },

    /** Carrega observações sincronizadas do banco (user_observations, últimos 35 dias). */
    async fetchSynced(matricula: string): Promise<void> {
      if (!navigator.onLine) return;
      const supabase = getSupabase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rawData } = await supabase
        .from("user_observations")
        .select("id,matricula,observador,auditagem,data,base,equipe,resumo,status,sync_status,comentario_analise,analisado_por")
        .eq("matricula", matricula)
        .gt("expires_at", new Date().toISOString())
        .order("data", { ascending: false });

      if (!rawData) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = rawData as any[];

      // Restaura rascunhos em_andamento ao items local se o localStorage foi limpo
      let persistNeeded = false;
      for (const row of data) {
        if ((row as { sync_status?: string }).sync_status !== "em_andamento") continue;
        if (this.items.find((o) => o.id === row.id)) continue; // já existe localmente
        const resumoRaw = row.resumo as unknown as {
          total?: number; conformes?: number; naoConformes?: number;
          _rascunho?: { membros?: { nome: string; matricula: string }[]; respostas?: RespostaSalva[]; fotosUrls?: string[] };
        };
        const rascunho = resumoRaw?._rascunho;
        const restorado: ObservacaoChecklist = {
          id: row.id,
          matricula: row.matricula,
          observador: row.observador,
          auditagem: row.auditagem as AuditagemCategoria,
          data: row.data,
          base: row.base,
          equipe: row.equipe,
          membros: rascunho?.membros ?? [],
          fotosLocal: (rascunho?.fotosUrls ?? []).filter(Boolean),
          respostas: rascunho?.respostas ?? [],
          resumo: {
            total: resumoRaw?.total ?? 0,
            conformes: resumoRaw?.conformes ?? 0,
            naoConformes: resumoRaw?.naoConformes ?? 0,
          },
          status: "em_andamento",
        };
        this.items.push(restorado);
        persistNeeded = true;
      }
      if (persistNeeded) this.persist();

      // Itens finalizados (excluindo rascunhos)
      const finalizados = data.filter(
        (row) => (row as { sync_status?: string }).sync_status !== "em_andamento"
      );
      const respostasPorItem = await fetchNaoConformesParaItens(finalizados.map((row) => row.id));
      this.syncedItems = finalizados.map((row) => ({
        id: row.id,
        matricula: row.matricula,
        observador: row.observador,
        auditagem: row.auditagem as AuditagemCategoria,
        data: row.data,
        base: row.base,
        equipe: row.equipe,
        membros: [],
        fotosLocal: [],
        respostas: respostasPorItem.get(row.id) ?? [],
        resumo: row.resumo as unknown as ChecklistResumo,
        syncStatus: "synced",
        analiseStatus: (row.status as "aprovado" | "reprovado" | "pendente") ?? "pendente",
        analiseMotivo: row.comentario_analise ?? null,
        analisadoPor: row.analisado_por ?? null,
      }));
    },

    add(payload: Omit<Observacao, "id" | "data"> & { data: string; employee: Employee }) {
      const { employee, data, ...obs } = payload;
      const entry: Observacao = { ...obs, id: crypto.randomUUID(), data };
      this.items.unshift(entry);
      this.persist();
      if (isRemoteSyncEnabled()) {
        void syncObservacaoLivreToRemote(entry, employee).catch(() => {});
      }
      return entry;
    },

    /** Envia um checklist. Nunca roda duas vezes em paralelo para o mesmo item. */
    syncItem(item: ObservacaoChecklist): Promise<boolean> {
      const running = inflight.get(item.id);
      if (running) return running;

      const task = (async () => {
        const employee = resolveEmployee(item.matricula);
        const attempts = item.syncAttempts ?? 0;
        item.syncStatus = "pending";
        try {
          if (!employee) throw new Error(`Colaborador ${item.matricula} não encontrado`);
          const { failedPhotos } = await syncChecklistToRemote(item, employee, {
            allowPhotoLoss: attempts >= MAX_ATTEMPTS_KEEP_PHOTOS,
          });
          item.syncStatus = "synced";
          item.fotosLocal = [];
          delete item.syncAttempts;
          delete item.syncError;
          delete item.syncNextAt;
          if (failedPhotos > 0) {
            Notify.create({
              type: "warning",
              icon: "mdi-image-off-outline",
              message: `Checklist da equipe ${item.equipe || "—"} enviado, mas ${failedPhotos} foto${failedPhotos > 1 ? "s" : ""} não ${failedPhotos > 1 ? "puderam" : "pôde"} ser enviada${failedPhotos > 1 ? "s" : ""}.`,
              position: "top",
              timeout: 10000,
            });
          }
          return true;
        } catch (err) {
          const message = friendlyError(err);
          const tries = attempts + 1;
          item.syncStatus = "failed";
          item.syncAttempts = tries;
          item.syncError = message;
          item.syncNextAt = Date.now() + nextAttemptDelay(tries, isNetworkError(message));
          return false;
        } finally {
          this.persist();
          inflight.delete(item.id);
        }
      })();

      inflight.set(item.id, task);
      return task;
    },

    /**
     * Envia a fila inteira, um item por vez (conexão de campo costuma ser fraca).
     * force=false respeita o backoff de cada item (usado pelo timer periódico).
     */
    syncQueue(opts: { force?: boolean } = {}): Promise<void> {
      if (queueRun) return queueRun;
      if (!this.hydrated || !navigator.onLine || !isSupabaseSyncEnabled()) return Promise.resolve();

      const agora = Date.now();
      const alvos = this.queue.filter((o) => opts.force || !o.syncNextAt || o.syncNextAt <= agora);
      if (!alvos.length) return Promise.resolve();

      this.syncing = true;
      queueRun = (async () => {
        let enviados = 0;
        try {
          for (const item of alvos) {
            if (!navigator.onLine) break;
            if (item.syncStatus === "synced") continue;
            if (await this.syncItem(item)) {
              enviados++;
            } else if (isNetworkError(item.syncError)) {
              break; // conexão caiu: não adianta tentar os próximos agora
            }
          }
        } finally {
          this.syncing = false;
          queueRun = null;
        }

        if (enviados > 0) {
          this.lastSyncAt = Date.now();
          const restantes = this.pendingCount;
          Notify.create({
            type: "positive",
            icon: "mdi-cloud-check-outline",
            message: enviados === 1
              ? "1 checklist salvo offline foi enviado automaticamente."
              : `${enviados} checklists salvos offline foram enviados automaticamente.`,
            ...(restantes > 0 ? { caption: `${restantes} ainda na fila` } : {}),
            position: "top",
            timeout: 4000,
          });
          void refreshServerTimeSync();
          const matricula = useSessionStore().matricula;
          if (matricula) void this.fetchSynced(matricula).catch(() => {});
        }
      })();
      return queueRun;
    },

    /**
     * Uma vez por aparelho: versões antigas marcavam como "Enviado" checklists
     * finalizados offline que nunca chegaram ao servidor. Confere no servidor e
     * devolve esses itens à fila.
     */
    async reconcileOnce() {
      if (reconcileDone || !navigator.onLine || !this.hydrated) return;
      if (LocalStorage.getItem<boolean>(RECONCILE_FLAG)) { reconcileDone = true; return; }

      // Janela curta: o painel admin pode excluir checklists, e não queremos reenviar esses.
      const desde = Date.now() - RECONCILE_WINDOW_MS;
      const candidatos = this.items.filter(
        (o): o is ObservacaoChecklist =>
          isChecklist(o) &&
          o.status !== "em_andamento" &&
          o.syncStatus === "synced" &&
          new Date(o.data).getTime() >= desde
      );
      if (candidatos.length) {
        let existentes: Set<string>;
        try {
          existentes = await fetchExistingClientIds(candidatos.map((o) => o.id));
        } catch {
          return; // tenta de novo na próxima rodada
        }
        let resgatados = 0;
        for (const o of candidatos) {
          if (existentes.has(o.id)) continue;
          o.syncStatus = "failed";
          o.syncError = "Não chegou ao servidor";
          delete o.syncNextAt;
          resgatados++;
        }
        if (resgatados) this.persist();
      }
      reconcileDone = true;
      LocalStorage.set(RECONCILE_FLAG, true);
    },

    /** Ponto único chamado pelos gatilhos automáticos (boot, online, volta ao app, timer). */
    async autoSync(opts: { force?: boolean } = {}) {
      if (!this.hydrated || !navigator.onLine) return;
      await this.reconcileOnce();
      await this.syncQueue(opts);
    },

    addChecklist(payload: {
      auditagem: AuditagemCategoria;
      matricula: string;
      observador: string;
      base: string;
      equipe: string;
      membros: { nome: string; matricula: string }[];
      fotosLocal: string[];
      respostas: RespostaSalva[];
      data: string;
      employee: Employee;
      status?: "finalizado" | "em_andamento";
    }) {
      const resumo: ChecklistResumo = {
        total: payload.respostas.length,
        conformes: payload.respostas.filter((r) => r.resposta === "conforme").length,
        naoConformes: payload.respostas.filter((r) => r.resposta === "nao_conforme").length,
      };

      const emAndamento = payload.status === "em_andamento";

      const entry: ObservacaoChecklist = {
        id: crypto.randomUUID(),
        data: payload.data,
        auditagem: payload.auditagem,
        matricula: payload.matricula,
        observador: payload.observador,
        base: payload.base,
        equipe: payload.equipe,
        membros: payload.membros,
        fotosLocal: payload.fotosLocal,
        respostas: payload.respostas,
        resumo,
        ...(!emAndamento && isSupabaseSyncEnabled() ? { syncStatus: "pending" as const } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
      };

      this.items.unshift(entry);
      this.persist();

      if (emAndamento) {
        void syncEmAndamentoToRemote(entry).catch(() => {/* offline: ok */});
        return entry;
      }

      // Offline o item fica "pending" na fila; os gatilhos automáticos enviam quando a rede voltar.
      if (isSupabaseSyncEnabled() && navigator.onLine) {
        // Pega o item recém-criado pelo proxy reativo do estado para a UI acompanhar o status.
        const reativo = this.items.find((o) => o.id === entry.id);
        if (reativo && isChecklist(reativo)) {
          void this.syncItem(reativo).then(async (ok) => {
            if (!ok) return;
            await refreshServerTimeSync();
            await this.fetchSynced(payload.matricula).catch(() => {});
            if (this.pendingCount > 0) void this.syncQueue({ force: true });
          });
        }
      }

      return entry;
    },

    toggleResolvido(id: string) {
      const item = this.items.find((o) => o.id === id);
      if (item && !isChecklist(item)) { item.resolvido = !item.resolvido; this.persist(); }
    },

    remove(id: string) {
      const target = this.items.find((o) => o.id === id);
      this.items = this.items.filter((o) => o.id !== id);
      this.persist();
      if (target && isChecklist(target) && target.status === "em_andamento") {
        void deleteEmAndamentoFromRemote(id).catch(() => {});
      }
    },

    getSyncStatus(item: ObservacaoChecklist): SyncStatus {
      if (item.syncStatus === "synced") return "synced";
      if (item.syncStatus === "failed") return "failed";
      if (item.syncStatus === "pending") return "pending";
      return "local";
    },

    /** Envio manual ("Enviar agora"). Retorna null se deu certo, ou a mensagem de erro. */
    async reenviar(id: string): Promise<string | null> {
      const item = this.items.find((o) => o.id === id);
      if (!item || !isChecklist(item)) return "Registro não encontrado";
      if (!navigator.onLine) {
        return "Sem conexão. Ele será enviado automaticamente quando a internet voltar.";
      }
      const ok = await this.syncItem(item);
      if (!ok) return item.syncError ?? "Erro desconhecido";
      void refreshServerTimeSync();
      await this.fetchSynced(item.matricula).catch(() => {});
      if (this.pendingCount > 0) void this.syncQueue({ force: true });
      return null;
    },

    updateChecklist(id: string, updates: Partial<ObservacaoChecklist>) {
      const item = this.items.find((o) => o.id === id);
      if (!item || !isChecklist(item)) return;
      Object.assign(item, updates);
      this.persist();
    },
  },
});
