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
export function contaNaMeta(o: RegistroObservacao): boolean {
  if (!isChecklist(o)) return true;
  if (o.status === "em_andamento") return false;
  const esperado = TOTAL_POR_AUDITAGEM[o.auditagem];
  if (!esperado) return true;
  const respondidas = o.resumo?.total ?? o.respostas?.length ?? 0;
  return respondidas >= esperado;
}
