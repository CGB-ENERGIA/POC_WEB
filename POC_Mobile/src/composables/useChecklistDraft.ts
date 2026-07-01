import { onMounted, watch, type Ref } from "vue";
import {
  checklistDraftKey,
  clearChecklistDraft,
  draftHasContent,
  loadChecklistDraft,
  saveChecklistDraft,
  type ChecklistDraftData,
} from "@/utils/checklist-draft";

interface ChecklistDraftState {
  base: Ref<string>;
  equipe: Ref<string>;
  membros: Ref<{ nome: string; matricula: string }[]>;
  respostas: Record<string, string>;
  detalhesMap: Record<string, { observacao: string; foto: string }>;
  expandedCategories: Record<string, boolean>;
}

export function useChecklistDraft(
  auditagem: "GOMAN" | "GSTC",
  matricula: string,
  state: ChecklistDraftState
) {
  const key = checklistDraftKey(auditagem, matricula);

  function snapshot(): ChecklistDraftData {
    return {
      base: state.base.value,
      equipe: state.equipe.value,
      membros: state.membros.value.map((m) => ({ ...m })),
      respostas: { ...state.respostas },
      detalhesMap: { ...state.detalhesMap },
      expandedCategories: { ...state.expandedCategories },
    };
  }

  function persistDraft() {
    const data = snapshot();
    if (draftHasContent(data)) {
      saveChecklistDraft(key, data);
    } else {
      clearChecklistDraft(key);
    }
  }

  function restoreDraft() {
    const draft = loadChecklistDraft(key);
    if (!draft) return;

    state.base.value = draft.base;
    state.equipe.value = draft.equipe;
    state.membros.value = draft.membros;
    Object.assign(state.respostas, draft.respostas);
    Object.assign(state.detalhesMap, draft.detalhesMap);
    Object.assign(state.expandedCategories, draft.expandedCategories);
  }

  onMounted(restoreDraft);

  watch([state.base, state.equipe, state.membros], persistDraft, { deep: true });
  watch(state.respostas, persistDraft, { deep: true });
  watch(state.detalhesMap, persistDraft, { deep: true });
  watch(state.expandedCategories, persistDraft, { deep: true });

  return {
    clearDraft: () => clearChecklistDraft(key),
  };
}
