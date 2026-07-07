import { defineStore } from "pinia";
import { LocalStorage } from "quasar";

import type { AuditagemCategoria } from "@/data/auditagem";
import type { Employee } from "@/data/employees";
import type { ChecklistResumo, ObservacaoChecklist, RespostaSalva } from "@/types/checklist";
import { isRemoteSyncEnabled, isSupabaseSyncEnabled } from "@/lib/config";
import { syncChecklistToRemote } from "@/services/checklist-sync";
import { syncObservacaoLivreToRemote } from "@/services/observacao-sync";
import { refreshServerTimeSync } from "@/utils/server-time";
import { getSupabase } from "@/lib/supabase";

export type SyncStatus = "pending" | "synced" | "failed" | "local";

const STORAGE_KEY = "cgb-observacoes";

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

export const useObservacoesStore = defineStore("observacoes", {
  state: (): ObservacoesState => ({
    items: loadItems(),
    syncedItems: [],  // itens buscados do Supabase (user_observations)
  }),

  getters: {
    byMatricula: (state) => (matricula: string) => {
      // Itens locais não sincronizados
      const localPending = state.items
        .filter((o) => o.matricula === matricula)
        .filter((o) => !isChecklist(o) || o.syncStatus !== "synced");

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
      LocalStorage.set(STORAGE_KEY, this.items);
    },

    /** Carrega observações sincronizadas do banco (user_observations, últimos 35 dias). */
    async fetchSynced(matricula: string): Promise<void> {
      if (!navigator.onLine) return;
      const supabase = getSupabase();
      const { data } = await supabase
        .from("user_observations")
        .select("id,matricula,observador,auditagem,data,base,equipe,resumo")
        .eq("matricula", matricula)
        .gt("expires_at", new Date().toISOString())
        .order("data", { ascending: false });

      if (!data) return;
      this.syncedItems = data.map((row) => ({
        id: row.id,
        matricula: row.matricula,
        observador: row.observador,
        auditagem: row.auditagem,
        data: row.data,
        base: row.base,
        equipe: row.equipe,
        membros: [],
        fotosLocal: [],
        respostas: [],
        resumo: row.resumo,
        syncStatus: "synced" as SyncStatus,
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
          .then(() => { item.syncStatus = "synced"; this.persist(); })
          .catch(() => { item.syncStatus = "failed"; this.persist(); });
      }
    },

    addChecklist(payload: {
      auditagem: "GOMAN" | "GSTC";
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
          .then(async () => {
            entry.syncStatus = "synced";
            this.persist();
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
        await syncChecklistToRemote(item, employee);
        item.syncStatus = "synced";
        await refreshServerTimeSync();
        this.persist();
        await this.fetchSynced(item.matricula);
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
