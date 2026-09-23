import { defineStore } from "pinia";
import { LocalStorage, Notify } from "quasar";

import type { AuditagemCategoria } from "@/data/auditagem";
import type { Employee } from "@/data/employees";
import type { ChecklistResumo, ObservacaoChecklist, RespostaSalva } from "@/types/checklist";
import type { ItemVerificado } from "@/data/goman-checklist";
import { appConfig, isRemoteSyncEnabled, isSupabaseSyncEnabled } from "@/lib/config";
import { syncChecklistToRemote } from "@/services/checklist-sync";
import { syncObservacaoLivreToRemote } from "@/services/observacao-sync";
import { refreshServerTimeSync } from "@/utils/server-time";
import { getSupabase } from "@/lib/supabase";

export type SyncStatus = "pending" | "synced" | "failed" | "local";

const STORAGE_KEY = "cgb-observacoes";

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

    countByMatricula: (state) => (matricula: string) =>
      state.items.filter((o) => o.matricula === matricula).length,
  },

  actions: {
    persist() {
      try {
        LocalStorage.set(STORAGE_KEY, this.items);
      } catch (err) {
        if (!isQuotaExceeded(err)) return;
        // localStorage cheio de fotos base64 de checklists antigos já sincronizados
        // (o servidor já tem essas fotos — não precisam continuar ocupando espaço local).
        // Libera o máximo possível e tenta salvar de novo antes de desistir.
        if (this.freeSpaceForQuota()) {
          try {
            LocalStorage.set(STORAGE_KEY, this.items);
          } catch {
            // ainda não coube — não trava o app por isso, o envio remoto continua tentando.
          }
        }
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
      const { data } = await supabase
        .from("user_observations")
        .select("id,matricula,observador,auditagem,data,base,equipe,resumo,status,comentario_analise,analisado_por")
        .eq("matricula", matricula)
        .gt("expires_at", new Date().toISOString())
        .order("data", { ascending: false });

      if (!data) return;
      const respostasPorItem = await fetchNaoConformesParaItens(data.map((row) => row.id));
      this.syncedItems = data.map((row) => ({
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

    retryFailedSyncs(employee: Employee) {
      if (!isRemoteSyncEnabled() || !navigator.onLine) return;
      for (const item of this.items) {
        if (!isChecklist(item) || item.syncStatus !== "failed") continue;
        item.syncStatus = "pending";
        void syncChecklistToRemote(item, employee)
          .then(({ failedPhotos }) => {
            item.syncStatus = "synced";
            item.fotosLocal = [];
            this.persist();
            if (failedPhotos > 0) {
              Notify.create({
                type: "warning",
                icon: "mdi-image-off-outline",
                message: `Checklist enviado, mas ${failedPhotos} foto${failedPhotos > 1 ? "s" : ""} não ${failedPhotos > 1 ? "puderam" : "pôde"} ser enviada${failedPhotos > 1 ? "s" : ""}.`,
                position: "top",
                timeout: 10000,
              });
            }
          })
          .catch(() => { item.syncStatus = "failed"; this.persist(); });
      }
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
    }) {
      const resumo: ChecklistResumo = {
        total: payload.respostas.length,
        conformes: payload.respostas.filter((r) => r.resposta === "conforme").length,
        naoConformes: payload.respostas.filter((r) => r.resposta === "nao_conforme").length,
      };

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
        syncStatus: isSupabaseSyncEnabled() ? "pending" : undefined,
      };

      this.items.unshift(entry);
      this.persist();

      if (isSupabaseSyncEnabled()) {
        void syncChecklistToRemote(entry, payload.employee)
          .then(async ({ failedPhotos }) => {
            entry.syncStatus = "synced";
            entry.fotosLocal = [];
            this.persist();
            if (failedPhotos > 0) {
              Notify.create({
                type: "warning",
                icon: "mdi-image-off-outline",
                message: `Checklist enviado, mas ${failedPhotos} foto${failedPhotos > 1 ? "s" : ""} não ${failedPhotos > 1 ? "puderam" : "pôde"} ser enviada${failedPhotos > 1 ? "s" : ""}. Verifique a conexão e tente reenviar.`,
                position: "top",
                timeout: 10000,
              });
            }
            await refreshServerTimeSync();
            await this.fetchSynced(payload.matricula);
          })
          .catch(() => { entry.syncStatus = "failed"; this.persist(); });
      }

      return entry;
    },

    toggleResolvido(id: string) {
      const item = this.items.find((o) => o.id === id);
      if (item && !isChecklist(item)) { item.resolvido = !item.resolvido; this.persist(); }
    },

    remove(id: string) {
      this.items = this.items.filter((o) => o.id !== id);
      this.persist();
    },

    getSyncStatus(item: ObservacaoChecklist): SyncStatus {
      if (item.syncStatus === "synced") return "synced";
      if (item.syncStatus === "failed") return "failed";
      if (item.syncStatus === "pending") return "pending";
      return "local";
    },

    async reenviar(id: string, employee: Employee): Promise<string | null> {
      const item = this.items.find((o) => o.id === id);
      if (!item || !isChecklist(item)) return "Registro não encontrado";
      item.syncStatus = "pending";
      this.persist();
      try {
        const { failedPhotos } = await syncChecklistToRemote(item, employee);
        item.syncStatus = "synced";
        item.fotosLocal = [];
        await refreshServerTimeSync();
        this.persist();
        await this.fetchSynced(item.matricula);
        if (failedPhotos > 0) {
          return `${failedPhotos} foto${failedPhotos > 1 ? "s" : ""} não ${failedPhotos > 1 ? "puderam" : "pôde"} ser enviada${failedPhotos > 1 ? "s" : ""} — o restante foi salvo`;
        }
        return null;
      } catch (err) {
        item.syncStatus = "failed";
        this.persist();
        return err instanceof Error ? err.message : "Erro desconhecido";
      }
    },

    updateChecklist(id: string, updates: Partial<ObservacaoChecklist>) {
      const item = this.items.find((o) => o.id === id);
      if (!item || !isChecklist(item)) return;
      Object.assign(item, updates);
      this.persist();
    },
  },
});
