import { defineStore } from "pinia";
import { LocalStorage } from "quasar";

import type { AuditagemCategoria } from "@/data/auditagem";
import type { RespostaPergunta } from "@/data/goman-checklist";
import type { ChecklistResumo, ObservacaoChecklist, RespostaSalva } from "@/types/checklist";

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
  }),

  getters: {
    byMatricula: (state) => (matricula: string) =>
      state.items
        .filter((o) => o.matricula === matricula)
        .sort((a, b) => b.data.localeCompare(a.data)),

    countByMatricula: (state) => (matricula: string) =>
      state.items.filter((o) => o.matricula === matricula).length,
  },

  actions: {
    persist() {
      LocalStorage.set(STORAGE_KEY, this.items);
    },

    add(obs: Omit<Observacao, "id" | "data">) {
      const entry: Observacao = {
        ...obs,
        id: crypto.randomUUID(),
        data: new Date().toISOString(),
      };
      this.items.unshift(entry);
      this.persist();
      return entry;
    },

    addChecklist(payload: {
      matricula: string;
      observador: string;
      base: string;
      equipe: string;
      membros: { nome: string; matricula: string }[];
      respostas: RespostaSalva[];
    }) {
      const resumo: ChecklistResumo = {
        total: payload.respostas.length,
        conformes: payload.respostas.filter((r) => r.resposta === "conforme").length,
        naoConformes: payload.respostas.filter((r) => r.resposta === "nao_conforme").length,
      };

      const respostas: RespostaPergunta[] = payload.respostas.map(
        ({ perguntaId, resposta, observacao, foto }) => ({
          perguntaId,
          resposta,
          ...(observacao ? { observacao } : {}),
          ...(foto ? { foto } : {}),
        })
      );

      const entry: ObservacaoChecklist = {
        id: crypto.randomUUID(),
        data: new Date().toISOString(),
        auditagem: "GOMAN",
        matricula: payload.matricula,
        observador: payload.observador,
        base: payload.base,
        equipe: payload.equipe,
        membros: payload.membros,
        respostas,
        resumo,
      };

      this.items.unshift(entry);
      this.persist();
      return entry;
    },

    toggleResolvido(id: string) {
      const item = this.items.find((o) => o.id === id);
      if (item && !isChecklist(item)) {
        item.resolvido = !item.resolvido;
        this.persist();
      }
    },

    remove(id: string) {
      this.items = this.items.filter((o) => o.id !== id);
      this.persist();
    },
  },
});
