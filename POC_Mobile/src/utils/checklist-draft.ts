import { LocalStorage } from "quasar";

export interface ChecklistDraftData {
  base: string;
  equipe: string;
  membros: { nome: string; matricula: string }[];
  respostas: Record<string, string>;
  detalhesMap: Record<string, { observacao: string; foto: string }>;
  expandedCategories: Record<string, boolean>;
}

export function checklistDraftKey(
  auditagem: "GOMAN" | "GSTC",
  matricula: string
): string {
  return `cgb-checklist-draft-${auditagem}-${matricula}`;
}

export function loadChecklistDraft(key: string): ChecklistDraftData | null {
  return LocalStorage.getItem<ChecklistDraftData>(key);
}

export function saveChecklistDraft(key: string, data: ChecklistDraftData) {
  LocalStorage.set(key, data);
}

export function clearChecklistDraft(key: string) {
  LocalStorage.remove(key);
}

export function draftHasContent(data: ChecklistDraftData): boolean {
  if (data.base.trim() || data.equipe.trim()) return true;
  if (data.membros.some((m) => m.nome.trim() || m.matricula.trim())) return true;
  if (Object.keys(data.respostas).length > 0) return true;
  if (Object.keys(data.detalhesMap).length > 0) return true;
  return false;
}
