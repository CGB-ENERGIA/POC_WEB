import { totalPerguntasAdministrativo } from "@/data/administrativo-checklist";
import { totalPerguntasAlojamento } from "@/data/alojamento-checklist";
import { totalPerguntasGoman } from "@/data/goman-checklist";
import { totalPerguntasGstc } from "@/data/gstc-checklist";
import { totalPerguntasLogistica } from "@/data/logistica-checklist";
import { totalPerguntasOficina } from "@/data/oficina-checklist";
import { isChecklist, type RegistroObservacao } from "@/stores/observacoes";

const TOTAL_POR_AUDITAGEM: Record<string, number> = {
  GOMAN: totalPerguntasGoman,
  GSTC: totalPerguntasGstc,
  ADMINISTRATIVO: totalPerguntasAdministrativo,
  ALOJAMENTO: totalPerguntasAlojamento,
  LOGISTICA: totalPerguntasLogistica,
  OFICINA: totalPerguntasOficina,
};

export function totalPerguntasAuditagem(auditagem: string): number | undefined {
  return TOTAL_POR_AUDITAGEM[auditagem];
}

export function contarRespondidas(
  perguntaIds: string[],
  respostas: Record<string, string | null | undefined>
): number {
  return perguntaIds.filter((id) => !!respostas[id]).length;
}

export function gruposPendentes<T extends { id: string; label: string; perguntas: { id: string }[] }>(
  checklist: T[],
  respostas: Record<string, string | null | undefined>
): { id: string; label: string; faltam: number; primeiraPerguntaId: string }[] {
  return checklist
    .map((cat) => {
      const faltando = cat.perguntas.filter((p) => !respostas[p.id]);
      return {
        id: cat.id,
        label: cat.label,
        faltam: faltando.length,
        primeiraPerguntaId: faltando[0]?.id ?? "",
      };
    })
    .filter((g) => g.faltam > 0);
}

export function contaNaMeta(o: RegistroObservacao): boolean {
  if (!isChecklist(o)) return true;
  if (o.status === "em_andamento") return false;
  const esperado = TOTAL_POR_AUDITAGEM[o.auditagem];
  if (!esperado) return true;
  const respondidas = o.resumo?.total ?? o.respostas?.length ?? 0;
  return respondidas >= esperado;
}
