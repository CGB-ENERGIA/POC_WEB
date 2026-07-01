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
  auditagem: "GOMAN" | "GSTC";
  data: string;
  base: string;
  equipe: string;
  membros: { nome: string; matricula: string }[];
  fotosLocal: string[];
  respostas: RespostaPergunta[];
  resumo: ChecklistResumo;
}

export type RespostaSalva = RespostaPergunta & {
  categoria: string;
  pergunta: string;
  gravidade: string;
  peso: number;
};
