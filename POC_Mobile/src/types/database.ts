export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      checklist_photos: {
        Row: {
          created_at: string
          id: string
          pergunta_id: string | null
          r2_key: string
          sort_order: number
          submission_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          pergunta_id?: string | null
          r2_key: string
          sort_order?: number
          submission_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          id?: string
          pergunta_id?: string | null
          r2_key?: string
          sort_order?: number
          submission_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_photos_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "checklist_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_responses: {
        Row: {
          atribuido_matricula: string | null
          atribuido_nome: string | null
          atribuido_tipo: string | null
          categoria: string
          created_at: string
          foto_r2_key: string | null
          gravidade: string
          id: string
          itens: Json | null
          observacao: string | null
          pergunta: string
          pergunta_id: string
          peso: number
          resolvido: boolean | null
          resposta: string
          submission_id: string
        }
        Insert: {
          atribuido_matricula?: string | null
          atribuido_nome?: string | null
          atribuido_tipo?: string | null
          categoria: string
          created_at?: string
          foto_r2_key?: string | null
          gravidade: string
          id?: string
          itens?: Json | null
          observacao?: string | null
          pergunta: string
          pergunta_id: string
          peso: number
          resolvido?: boolean | null
          resposta: string
          submission_id: string
        }
        Update: {
          atribuido_matricula?: string | null
          atribuido_nome?: string | null
          atribuido_tipo?: string | null
          categoria?: string
          created_at?: string
          foto_r2_key?: string | null
          gravidade?: string
          id?: string
          itens?: Json | null
          observacao?: string | null
          pergunta?: string
          pergunta_id?: string
          peso?: number
          resolvido?: boolean | null
          resposta?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_responses_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "checklist_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_submissions: {
        Row: {
          analisado_por: string | null
          auditagem: string
          base: string
          client_id: string | null
          comentario_analise: string | null
          created_at: string
          data: string
          data_analise: string | null
          equipe: string
          id: string
          matricula: string
          membros: Json
          observador: string
          resumo: Json
          status: string
          synced_at: string
        }
        Insert: {
          analisado_por?: string | null
          auditagem: string
          base: string
          client_id?: string | null
          comentario_analise?: string | null
          created_at?: string
          data: string
          data_analise?: string | null
          equipe: string
          id?: string
          matricula: string
          membros?: Json
          observador: string
          resumo?: Json
          status?: string
          synced_at?: string
        }
        Update: {
          analisado_por?: string | null
          auditagem?: string
          base?: string
          client_id?: string | null
          comentario_analise?: string | null
          created_at?: string
          data?: string
          data_analise?: string | null
          equipe?: string
          id?: string
          matricula?: string
          membros?: Json
          observador?: string
          resumo?: Json
          status?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_submissions_matricula_fkey"
            columns: ["matricula"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["matricula"]
          },
        ]
      }
      employees: {
        Row: {
          ativo: boolean
          base: string
          created_at: string
          funcao: string
          gerencia: string
          matricula: string
          nome: string
          nome_completo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          base: string
          created_at?: string
          funcao: string
          gerencia: string
          matricula: string
          nome: string
          nome_completo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          base?: string
          created_at?: string
          funcao?: string
          gerencia?: string
          matricula?: string
          nome?: string
          nome_completo?: string
          updated_at?: string
        }
        Relationships: []
      }
      face_descriptors: {
        Row: {
          created_at: string | null
          descriptor: number[]
          email: string
          face_token: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          descriptor: number[]
          email: string
          face_token: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          descriptor?: number[]
          email?: string
          face_token?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      individual_goal_overrides: {
        Row: {
          ano: number
          created_at: string
          id: string
          matricula: string
          mes: number
          meta_semanal: number
          motivo: string
          nome: string
          semana: number
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          id?: string
          matricula: string
          mes: number
          meta_semanal: number
          motivo?: string
          nome: string
          semana?: number
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          id?: string
          matricula?: string
          mes?: number
          meta_semanal?: number
          motivo?: string
          nome?: string
          semana?: number
          updated_at?: string
        }
        Relationships: []
      }
      metas: {
        Row: {
          ano: number
          mes: number
          normais_semanal: number
          seguranca_semanal: number
          updated_at: string
        }
        Insert: {
          ano: number
          mes: number
          normais_semanal?: number
          seguranca_semanal?: number
          updated_at?: string
        }
        Update: {
          ano?: number
          mes?: number
          normais_semanal?: number
          seguranca_semanal?: number
          updated_at?: string
        }
        Relationships: []
      }
      mobile_device_credentials: {
        Row: {
          created_at: string | null
          credential_id: string
          id: string
          matricula: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          credential_id: string
          id?: string
          matricula: string
          nome: string
        }
        Update: {
          created_at?: string | null
          credential_id?: string
          id?: string
          matricula?: string
          nome?: string
        }
        Relationships: []
      }
      mobile_face_descriptors: {
        Row: {
          created_at: string | null
          descriptor: number[]
          id: string
          matricula: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          descriptor: number[]
          id?: string
          matricula: string
          nome: string
        }
        Update: {
          created_at?: string | null
          descriptor?: number[]
          id?: string
          matricula?: string
          nome?: string
        }
        Relationships: []
      }
      mobile_face_pending: {
        Row: {
          created_at: string | null
          descriptors: Json
          id: string
          matricula: string
          nome: string
          photo_base64: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          descriptors: Json
          id?: string
          matricula: string
          nome: string
          photo_base64?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          descriptors?: Json
          id?: string
          matricula?: string
          nome?: string
          photo_base64?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      nc_resolucoes: {
        Row: {
          analisado_por: string | null
          comentario_analise: string | null
          created_at: string
          data_analise: string | null
          data_resolucao: string
          foto_r2_key: string
          id: string
          observacao: string | null
          pergunta_id: string
          resolvido_por: string
          status: string
          submission_id: string
        }
        Insert: {
          analisado_por?: string | null
          comentario_analise?: string | null
          created_at?: string
          data_analise?: string | null
          data_resolucao?: string
          foto_r2_key: string
          id?: string
          observacao?: string | null
          pergunta_id: string
          resolvido_por: string
          status?: string
          submission_id: string
        }
        Update: {
          analisado_por?: string | null
          comentario_analise?: string | null
          created_at?: string
          data_analise?: string | null
          data_resolucao?: string
          foto_r2_key?: string
          id?: string
          observacao?: string | null
          pergunta_id?: string
          resolvido_por?: string
          status?: string
          submission_id?: string
        }
        Relationships: []
      }
      observacoes_livres: {
        Row: {
          auditagem: string
          base: string
          categoria: string
          client_id: string | null
          created_at: string
          data: string
          descricao: string
          equipe: string
          id: string
          item: string
          matricula: string
          observador: string
          resolvido: boolean
          severidade: string
          tipo: string
        }
        Insert: {
          auditagem: string
          base: string
          categoria: string
          client_id?: string | null
          created_at?: string
          data: string
          descricao: string
          equipe: string
          id?: string
          item: string
          matricula: string
          observador: string
          resolvido?: boolean
          severidade: string
          tipo: string
        }
        Update: {
          auditagem?: string
          base?: string
          categoria?: string
          client_id?: string | null
          created_at?: string
          data?: string
          descricao?: string
          equipe?: string
          id?: string
          item?: string
          matricula?: string
          observador?: string
          resolvido?: boolean
          severidade?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "observacoes_livres_matricula_fkey"
            columns: ["matricula"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["matricula"]
          },
        ]
      }
      pending_face_registrations: {
        Row: {
          created_at: string | null
          descriptor: number[]
          descriptors: Json | null
          email: string
          id: string
          name: string
          photo_base64: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          descriptor: number[]
          descriptors?: Json | null
          email: string
          id?: string
          name: string
          photo_base64?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          descriptor?: number[]
          descriptors?: Json | null
          email?: string
          id?: string
          name?: string
          photo_base64?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_observations: {
        Row: {
          auditagem: string
          base: string
          created_at: string
          data: string
          equipe: string
          expires_at: string
          id: string
          matricula: string
          observador: string
          resumo: Json
          status: string
          sync_status: string
        }
        Insert: {
          auditagem: string
          base: string
          created_at?: string
          data: string
          equipe: string
          expires_at?: string
          id: string
          matricula: string
          observador: string
          resumo?: Json
          status?: string
          sync_status?: string
        }
        Update: {
          auditagem?: string
          base?: string
          created_at?: string
          data?: string
          equipe?: string
          expires_at?: string
          id?: string
          matricula?: string
          observador?: string
          resumo?: Json
          status?: string
          sync_status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_face_registration: { Args: { reg_id: string }; Returns: Json }
      approve_mobile_face_registration: {
        Args: { reg_id: string }
        Returns: Json
      }
      ensure_employee: {
        Args: {
          p_base: string
          p_funcao: string
          p_gerencia: string
          p_matricula: string
          p_nome: string
          p_nome_completo: string
        }
        Returns: undefined
      }
      face_match: { Args: { descriptor: number[] }; Returns: Json }
      get_server_time: { Args: never; Returns: string }
      mobile_digital_credentials: {
        Args: { p_matricula: string }
        Returns: {
          credential_id: string
        }[]
      }
      mobile_digital_status: { Args: { p_matricula: string }; Returns: string }
      mobile_face_match: { Args: { p_descriptor: number[] }; Returns: Json }
      mobile_face_status: { Args: { p_matricula: string }; Returns: string }
      reject_face_registration: { Args: { reg_id: string }; Returns: undefined }
      reject_mobile_face_registration: {
        Args: { reg_id: string }
        Returns: undefined
      }
      remove_face_user: { Args: { reg_id: string }; Returns: Json }
      remove_mobile_face_registration: {
        Args: { reg_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
