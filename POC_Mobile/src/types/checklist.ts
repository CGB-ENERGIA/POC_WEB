import type { RespostaPergunta } from "@/data/goman-checklist";

export interface ChecklistResumo {
  total: number;
  conformes: number;
  naoConformes: number;
}

export interface ObservacaoChecklist {
  id: string;
  matricula: string;
  observador: string;
  auditagem: "GOMAN";
  data: string;
  base: string;
  equipe: string;
  membros: string[];
  respostas: RespostaPergunta[];
  resumo: ChecklistResumo;
}

export type RespostaSalva = RespostaPergunta & {
  categoria: string;
  pergunta: string;
  gravidade: string;
  peso: number;
};
