import { defineStore } from "pinia";
import { LocalStorage } from "quasar";
import type { Employee } from "@/data/employees";
import type { AuditagemCategoria } from "@/data/auditagem";

const STORAGE_KEY = "cgb-session";

export interface SessionData {
  employee: Employee;
  auditagem: AuditagemCategoria;
}

interface SessionState {
  employee: Employee | null;
  auditagem: AuditagemCategoria | null;
}

function isEmployee(value: unknown): value is Employee {
  return (
    typeof value === "object" &&
    value !== null &&
    "matricula" in value &&
    "nomeCompleto" in value
  );
}

function loadSession(): SessionState {
  const raw = LocalStorage.getItem<SessionData | Employee>(STORAGE_KEY);
  if (!raw) return { employee: null, auditagem: null };

  if (isEmployee(raw)) {
    LocalStorage.remove(STORAGE_KEY);
    return { employee: null, auditagem: null };
  }

  if (raw.employee && raw.auditagem) {
    return { employee: raw.employee, auditagem: raw.auditagem };
  }

  return { employee: null, auditagem: null };
}

export const useSessionStore = defineStore("session", {
  state: (): SessionState => loadSession(),

  getters: {
    isAuthenticated: (state) =>
      state.employee !== null && state.auditagem !== null,
    displayName: (state) => state.employee?.nome ?? "",
    matricula: (state) => state.employee?.matricula ?? "",
    auditagemLabel: (state) => state.auditagem ?? "",
  },

  actions: {
    login(employee: Employee, auditagem: AuditagemCategoria) {
      this.employee = employee;
      this.auditagem = auditagem;
      LocalStorage.set(STORAGE_KEY, { employee, auditagem });
    },

    logout() {
      this.employee = null;
      this.auditagem = null;
      LocalStorage.remove(STORAGE_KEY);
    },
  },
});
