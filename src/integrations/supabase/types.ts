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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      contas: {
        Row: {
          created_at: string
          id: string
          nome_conta: string
          produto_principal_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome_conta: string
          produto_principal_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome_conta?: string
          produto_principal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_produto_principal_id_fkey"
            columns: ["produto_principal_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      edicoes: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          nome_edicao: string
          produto_id: string
          valor_aprovado: number
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          nome_edicao: string
          produto_id: string
          valor_aprovado?: number
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          nome_edicao?: string
          produto_id?: string
          valor_aprovado?: number
        }
        Relationships: [
          {
            foreignKeyName: "edicoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      excecoes: {
        Row: {
          conta_id: string
          created_at: string
          data_final: string
          data_inicial: string
          id: string
          produto_id: string
        }
        Insert: {
          conta_id: string
          created_at?: string
          data_final: string
          data_inicial: string
          id?: string
          produto_id: string
        }
        Update: {
          conta_id?: string
          created_at?: string
          data_final?: string
          data_inicial?: string
          id?: string
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "excecoes_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "excecoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      jornada_normalizada: {
        Row: {
          canal_normalizado: string | null
          created_at: string | null
          data_lead: string | null
          data_matricula: string | null
          dias_antes_compra: number | null
          email: string | null
          id: number
          nome: string | null
          tipo: string | null
          toque_num: number | null
          turma: string | null
          utm_campanha: string | null
          utm_conteudo: string | null
          utm_midia: string | null
          utm_origem: string | null
          utm_termo: string | null
        }
        Insert: {
          canal_normalizado?: string | null
          created_at?: string | null
          data_lead?: string | null
          data_matricula?: string | null
          dias_antes_compra?: number | null
          email?: string | null
          id?: number
          nome?: string | null
          tipo?: string | null
          toque_num?: number | null
          turma?: string | null
          utm_campanha?: string | null
          utm_conteudo?: string | null
          utm_midia?: string | null
          utm_origem?: string | null
          utm_termo?: string | null
        }
        Update: {
          canal_normalizado?: string | null
          created_at?: string | null
          data_lead?: string | null
          data_matricula?: string | null
          dias_antes_compra?: number | null
          email?: string | null
          id?: number
          nome?: string | null
          tipo?: string | null
          toque_num?: number | null
          turma?: string | null
          utm_campanha?: string | null
          utm_conteudo?: string | null
          utm_midia?: string | null
          utm_origem?: string | null
          utm_termo?: string | null
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          created_at: string
          edicao_id: string | null
          id: string
          mes_referencia: string
          produto_id: string
          valor_aprovado: number
        }
        Insert: {
          created_at?: string
          edicao_id?: string | null
          id?: string
          mes_referencia: string
          produto_id: string
          valor_aprovado?: number
        }
        Update: {
          created_at?: string
          edicao_id?: string | null
          id?: string
          mes_referencia?: string
          produto_id?: string
          valor_aprovado?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_edicao_id_fkey"
            columns: ["edicao_id"]
            isOneToOne: false
            referencedRelation: "edicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          abreviacao: string
          cor_hex: string
          created_at: string
          edicao_anual_unica: boolean
          id: string
          nome_produto: string
        }
        Insert: {
          abreviacao: string
          cor_hex?: string
          created_at?: string
          edicao_anual_unica?: boolean
          id?: string
          nome_produto: string
        }
        Update: {
          abreviacao?: string
          cor_hex?: string
          created_at?: string
          edicao_anual_unica?: boolean
          id?: string
          nome_produto?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          created_at?: string
          id: string
          nome: string
          telefone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      regras_classificacao: {
        Row: {
          coluna: string
          created_at: string
          id: string
          operador: string
          prioridade: number
          produto_id: string
          valor: string
        }
        Insert: {
          coluna: string
          created_at?: string
          id?: string
          operador?: string
          prioridade?: number
          produto_id: string
          valor: string
        }
        Update: {
          coluna?: string
          created_at?: string
          id?: string
          operador?: string
          prioridade?: number
          produto_id?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "regras_classificacao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      sem_atribuicao: {
        Row: {
          categoria_origem: string | null
          cidade: string | null
          codigo_curso: string | null
          created_at: string | null
          data_matricula: string | null
          email: string | null
          equipe: string | null
          estado: string | null
          fase: string | null
          grupo_sem_atribuicao: string | null
          id: number
          id_da_venda: string | null
          nome: string | null
          nome_da_venda: string | null
          origem_lead: string | null
          pacote: string | null
          proprietario: string | null
          qtd_pagantes: number | null
          telefone: string | null
          turma: string | null
          ultima_origem_lead: string | null
          unidade: string | null
          valor: number | null
          valor_convertido: number | null
        }
        Insert: {
          categoria_origem?: string | null
          cidade?: string | null
          codigo_curso?: string | null
          created_at?: string | null
          data_matricula?: string | null
          email?: string | null
          equipe?: string | null
          estado?: string | null
          fase?: string | null
          grupo_sem_atribuicao?: string | null
          id?: number
          id_da_venda?: string | null
          nome?: string | null
          nome_da_venda?: string | null
          origem_lead?: string | null
          pacote?: string | null
          proprietario?: string | null
          qtd_pagantes?: number | null
          telefone?: string | null
          turma?: string | null
          ultima_origem_lead?: string | null
          unidade?: string | null
          valor?: number | null
          valor_convertido?: number | null
        }
        Update: {
          categoria_origem?: string | null
          cidade?: string | null
          codigo_curso?: string | null
          created_at?: string | null
          data_matricula?: string | null
          email?: string | null
          equipe?: string | null
          estado?: string | null
          fase?: string | null
          grupo_sem_atribuicao?: string | null
          id?: number
          id_da_venda?: string | null
          nome?: string | null
          nome_da_venda?: string | null
          origem_lead?: string | null
          pacote?: string | null
          proprietario?: string | null
          qtd_pagantes?: number | null
          telefone?: string | null
          turma?: string | null
          ultima_origem_lead?: string | null
          unidade?: string | null
          valor?: number | null
          valor_convertido?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_atribuidas: {
        Row: {
          canal: string | null
          cidade: string | null
          created_at: string | null
          data_matricula: string | null
          email: string | null
          estado: string | null
          id: number
          nome: string | null
          tipo_atribuicao: string | null
          turma: string | null
          utm_campanha: string | null
          utm_conteudo: string | null
          utm_midia: string | null
          utm_origem: string | null
          utm_termo: string | null
          valor_convertido: number | null
        }
        Insert: {
          canal?: string | null
          cidade?: string | null
          created_at?: string | null
          data_matricula?: string | null
          email?: string | null
          estado?: string | null
          id?: number
          nome?: string | null
          tipo_atribuicao?: string | null
          turma?: string | null
          utm_campanha?: string | null
          utm_conteudo?: string | null
          utm_midia?: string | null
          utm_origem?: string | null
          utm_termo?: string | null
          valor_convertido?: number | null
        }
        Update: {
          canal?: string | null
          cidade?: string | null
          created_at?: string | null
          data_matricula?: string | null
          email?: string | null
          estado?: string | null
          id?: number
          nome?: string | null
          tipo_atribuicao?: string | null
          turma?: string | null
          utm_campanha?: string | null
          utm_conteudo?: string | null
          utm_midia?: string | null
          utm_origem?: string | null
          utm_termo?: string | null
          valor_convertido?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      v_canais: {
        Row: {
          canal: string | null
          receita: number | null
          ticket_medio: number | null
          tipo_atribuicao: string | null
          vendas: number | null
        }
        Relationships: []
      }
      v_gaps: {
        Row: {
          categoria_origem: string | null
          grupo_sem_atribuicao: string | null
          receita: number | null
          turma: string | null
          vendas: number | null
        }
        Relationships: []
      }
      v_kpis: {
        Row: {
          pct_existente: number | null
          pct_inferida: number | null
          pct_sem_atribuicao: number | null
          receita_total: number | null
          ticket_medio: number | null
          total_vendas: number | null
        }
        Relationships: []
      }
      v_mensal: {
        Row: {
          canal: string | null
          mes: string | null
          receita: number | null
          vendas: number | null
        }
        Relationships: []
      }
      v_turmas: {
        Row: {
          canal: string | null
          receita: number | null
          ticket_medio: number | null
          turma: string | null
          vendas: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
