export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      checklist_photos: {
        Row: {
          created_at: string;
          id: string;
          pergunta_id: string | null;
          r2_key: string;
          sort_order: number;
          submission_id: string;
          tipo: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          pergunta_id?: string | null;
          r2_key: string;
          sort_order?: number;
          submission_id: string;
          tipo: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          pergunta_id?: string | null;
          r2_key?: string;
          sort_order?: number;
          submission_id?: string;
          tipo?: string;
        };
        Relationships: [];
      };
      checklist_responses: {
        Row: {
          categoria: string;
          created_at: string;
          foto_r2_key: string | null;
          gravidade: string;
          id: string;
          observacao: string | null;
          pergunta: string;
          pergunta_id: string;
          peso: number;
          resposta: string;
          submission_id: string;
        };
        Insert: {
          categoria: string;
          created_at?: string;
          foto_r2_key?: string | null;
          gravidade: string;
          id?: string;
          observacao?: string | null;
          pergunta: string;
          pergunta_id: string;
          peso: number;
          resposta: string;
          submission_id: string;
        };
        Update: {
          categoria?: string;
          created_at?: string;
          foto_r2_key?: string | null;
          gravidade?: string;
          id?: string;
          observacao?: string | null;
          pergunta?: string;
          pergunta_id?: string;
          peso?: number;
          resposta?: string;
          submission_id?: string;
        };
        Relationships: [];
      };
      checklist_submissions: {
        Row: {
          auditagem: string;
          base: string;
          client_id: string | null;
          created_at: string;
          data: string;
          equipe: string;
          id: string;
          matricula: string;
          membros: Json;
          observador: string;
          resumo: Json;
          synced_at: string;
        };
        Insert: {
          auditagem: string;
          base: string;
          client_id?: string | null;
          created_at?: string;
          data: string;
          equipe: string;
          id?: string;
          matricula: string;
          membros?: Json;
          observador: string;
          resumo?: Json;
          synced_at?: string;
        };
        Update: {
          auditagem?: string;
          base?: string;
          client_id?: string | null;
          created_at?: string;
          data?: string;
          equipe?: string;
          id?: string;
          matricula?: string;
          membros?: Json;
          observador?: string;
          resumo?: Json;
          synced_at?: string;
        };
        Relationships: [];
      };
      employees: {
        Row: {
          ativo: boolean;
          base: string;
          created_at: string;
          funcao: string;
          gerencia: string;
          matricula: string;
          nome: string;
          nome_completo: string;
          updated_at: string;
        };
        Insert: {
          ativo?: boolean;
          base: string;
          created_at?: string;
          funcao: string;
          gerencia: string;
          matricula: string;
          nome: string;
          nome_completo: string;
          updated_at?: string;
        };
        Update: {
          ativo?: boolean;
          base?: string;
          created_at?: string;
          funcao?: string;
          gerencia?: string;
          matricula?: string;
          nome?: string;
          nome_completo?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      observacoes_livres: {
        Row: {
          auditagem: string;
          base: string;
          categoria: string;
          client_id: string | null;
          created_at: string;
          data: string;
          descricao: string;
          equipe: string;
          id: string;
          item: string;
          matricula: string;
          observador: string;
          resolvido: boolean;
          severidade: string;
          tipo: string;
        };
        Insert: {
          auditagem: string;
          base: string;
          categoria: string;
          client_id?: string | null;
          created_at?: string;
          data: string;
          descricao: string;
          equipe: string;
          id?: string;
          item: string;
          matricula: string;
          observador: string;
          resolvido?: boolean;
          severidade: string;
          tipo: string;
        };
        Update: {
          auditagem?: string;
          base?: string;
          categoria?: string;
          client_id?: string | null;
          created_at?: string;
          data?: string;
          descricao?: string;
          equipe?: string;
          id?: string;
          item?: string;
          matricula?: string;
          observador?: string;
          resolvido?: boolean;
          severidade?: string;
          tipo?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_employee: {
        Args: {
          p_matricula: string;
          p_nome: string;
          p_nome_completo: string;
          p_gerencia: string;
          p_base: string;
          p_funcao: string;
        };
        Returns: undefined;
      };
      get_server_time: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
