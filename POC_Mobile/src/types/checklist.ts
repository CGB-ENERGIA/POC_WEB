import type { RespostaPergunta } from "@/data/goman-checklist";
import type { AuditagemCategoria } from "@/data/auditagem";

export interface ChecklistResumo {
  total: number;
  conformes: number;
  naoConformes: number;
}

export type RespostaSalva = RespostaPergunta & {
  categoria: string;
  pergunta: string;
  gravidade: string;
  peso: number;
};

export interface ObservacaoChecklist {
  id: string;
  matricula: string;
  observador: string;
  auditagem: AuditagemCategoria;
  data: string;
  base: string;
  equipe: string;
  membros: { nome: string; matricula: string }[];
  fotosLocal: string[];
  respostas: RespostaSalva[];
  resumo: ChecklistResumo;
  syncStatus?: "pending" | "synced" | "failed";
  syncAttempts?: number;
  syncError?: string | null;
  /** Epoch ms: antes disso o reenvio automático periódico não tenta de novo (backoff). */
  syncNextAt?: number;
  analiseStatus?: "aprovado" | "reprovado" | "pendente";
  analiseMotivo?: string | null;
  analisadoPor?: string | null;
  status?: "finalizado" | "em_andamento";
}
