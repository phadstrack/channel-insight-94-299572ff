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
      bridge_lead_venda: {
        Row: {
          created_at: string
          id: number
          is_pre_sale: boolean
          is_primary: boolean
          lead_id: string
          match_lag_days: number | null
          match_method: string
          match_score: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_pre_sale: boolean
          is_primary?: boolean
          lead_id: string
          match_lag_days?: number | null
          match_method: string
          match_score: number
          venda_id: string
        }
        Update: {
          created_at?: string
          id?: number
          is_pre_sale?: boolean
          is_primary?: boolean
          lead_id?: string
          match_lag_days?: number | null
          match_method?: string
          match_score?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bridge_lead_venda_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "fct_lead"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "bridge_lead_venda_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "fct_venda"
            referencedColumns: ["venda_id"]
          },
        ]
      }
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
      dim_pessoa: {
        Row: {
          cidade: string | null
          email: string | null
          email_key: string | null
          estado: string | null
          first_seen_at: string
          last_seen_at: string
          nome: string | null
          nome_key: string | null
          pessoa_id: string
          phone_key: string | null
          telefone: string | null
        }
        Insert: {
          cidade?: string | null
          email?: string | null
          email_key?: string | null
          estado?: string | null
          first_seen_at?: string
          last_seen_at?: string
          nome?: string | null
          nome_key?: string | null
          pessoa_id?: string
          phone_key?: string | null
          telefone?: string | null
        }
        Update: {
          cidade?: string | null
          email?: string | null
          email_key?: string | null
          estado?: string | null
          first_seen_at?: string
          last_seen_at?: string
          nome?: string | null
          nome_key?: string | null
          pessoa_id?: string
          phone_key?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      dq_findings: {
        Row: {
          batch_id: string | null
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: number
          rule: string
          severity: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: number
          rule: string
          severity: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: number
          rule?: string
          severity?: string
        }
        Relationships: []
      }
      dq_resolutions: {
        Row: {
          created_at: string
          entity: string | null
          entity_id: string | null
          finding_id: number | null
          id: number
          note: string | null
          resolved_by: string | null
          rule: string | null
        }
        Insert: {
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          finding_id?: number | null
          id?: number
          note?: string | null
          resolved_by?: string | null
          rule?: string | null
        }
        Update: {
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          finding_id?: number | null
          id?: number
          note?: string | null
          resolved_by?: string | null
          rule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dq_resolutions_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "dq_findings"
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
      fct_lead: {
        Row: {
          canal: string | null
          cidade: string | null
          created_at: string
          data_lead: string | null
          email: string | null
          email_key: string | null
          estado: string | null
          lead_id: string
          nome: string | null
          nome_key: string | null
          origem_lead: string | null
          pessoa_id: string | null
          phone_key: string | null
          raw: Json | null
          source: string
          source_id: string | null
          status_lead: string | null
          telefone: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          canal?: string | null
          cidade?: string | null
          created_at?: string
          data_lead?: string | null
          email?: string | null
          email_key?: string | null
          estado?: string | null
          lead_id?: string
          nome?: string | null
          nome_key?: string | null
          origem_lead?: string | null
          pessoa_id?: string | null
          phone_key?: string | null
          raw?: Json | null
          source: string
          source_id?: string | null
          status_lead?: string | null
          telefone?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          canal?: string | null
          cidade?: string | null
          created_at?: string
          data_lead?: string | null
          email?: string | null
          email_key?: string | null
          estado?: string | null
          lead_id?: string
          nome?: string | null
          nome_key?: string | null
          origem_lead?: string | null
          pessoa_id?: string | null
          phone_key?: string | null
          raw?: Json | null
          source?: string
          source_id?: string | null
          status_lead?: string | null
          telefone?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fct_lead_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "dim_pessoa"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      fct_venda: {
        Row: {
          canal_venda: string | null
          cidade: string | null
          created_at: string
          curso: string | null
          data_aprovacao: string | null
          data_criacao: string | null
          data_matricula: string | null
          email: string | null
          email_key: string | null
          estado: string | null
          fase: string | null
          id_venda: string | null
          nome: string | null
          nome_key: string | null
          origem_lead: string | null
          pacote: string | null
          pessoa_id: string | null
          phone_key: string | null
          proprietario: string | null
          qtd_pagantes: number | null
          qtd_parcelas: number | null
          raw: Json | null
          source: string
          source_id: string | null
          telefone: string | null
          turma: string | null
          ultima_origem_lead: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valor: number | null
          valor_convertido: number | null
          valor_moeda: string | null
          venda_id: string
        }
        Insert: {
          canal_venda?: string | null
          cidade?: string | null
          created_at?: string
          curso?: string | null
          data_aprovacao?: string | null
          data_criacao?: string | null
          data_matricula?: string | null
          email?: string | null
          email_key?: string | null
          estado?: string | null
          fase?: string | null
          id_venda?: string | null
          nome?: string | null
          nome_key?: string | null
          origem_lead?: string | null
          pacote?: string | null
          pessoa_id?: string | null
          phone_key?: string | null
          proprietario?: string | null
          qtd_pagantes?: number | null
          qtd_parcelas?: number | null
          raw?: Json | null
          source: string
          source_id?: string | null
          telefone?: string | null
          turma?: string | null
          ultima_origem_lead?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor?: number | null
          valor_convertido?: number | null
          valor_moeda?: string | null
          venda_id?: string
        }
        Update: {
          canal_venda?: string | null
          cidade?: string | null
          created_at?: string
          curso?: string | null
          data_aprovacao?: string | null
          data_criacao?: string | null
          data_matricula?: string | null
          email?: string | null
          email_key?: string | null
          estado?: string | null
          fase?: string | null
          id_venda?: string | null
          nome?: string | null
          nome_key?: string | null
          origem_lead?: string | null
          pacote?: string | null
          pessoa_id?: string | null
          phone_key?: string | null
          proprietario?: string | null
          qtd_pagantes?: number | null
          qtd_parcelas?: number | null
          raw?: Json | null
          source?: string
          source_id?: string | null
          telefone?: string | null
          turma?: string | null
          ultima_origem_lead?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor?: number | null
          valor_convertido?: number | null
          valor_moeda?: string | null
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fct_venda_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "dim_pessoa"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      google_ads_spend: {
        Row: {
          adgroup_id: string | null
          adgroup_name: string | null
          average_cpc: number | null
          campaign_id: string | null
          campaign_name: string | null
          campaign_type: string | null
          clicks: number | null
          conversion_value: number | null
          conversions: number | null
          cost: number | null
          cost_per_conversion: number | null
          created_at: string | null
          ctr: number | null
          customer_id: string | null
          customer_name: string | null
          date: string
          id: number
          impressions: number | null
          keyword: string | null
          keyword_match_type: string | null
          quality_score: number | null
          roas: number | null
          search_impression_share: number | null
          utm_campaign: string | null
          utm_content: string | null
        }
        Insert: {
          adgroup_id?: string | null
          adgroup_name?: string | null
          average_cpc?: number | null
          campaign_id?: string | null
          campaign_name?: string | null
          campaign_type?: string | null
          clicks?: number | null
          conversion_value?: number | null
          conversions?: number | null
          cost?: number | null
          cost_per_conversion?: number | null
          created_at?: string | null
          ctr?: number | null
          customer_id?: string | null
          customer_name?: string | null
          date: string
          id?: number
          impressions?: number | null
          keyword?: string | null
          keyword_match_type?: string | null
          quality_score?: number | null
          roas?: number | null
          search_impression_share?: number | null
          utm_campaign?: string | null
          utm_content?: string | null
        }
        Update: {
          adgroup_id?: string | null
          adgroup_name?: string | null
          average_cpc?: number | null
          campaign_id?: string | null
          campaign_name?: string | null
          campaign_type?: string | null
          clicks?: number | null
          conversion_value?: number | null
          conversions?: number | null
          cost?: number | null
          cost_per_conversion?: number | null
          created_at?: string | null
          ctr?: number | null
          customer_id?: string | null
          customer_name?: string | null
          date?: string
          id?: number
          impressions?: number | null
          keyword?: string | null
          keyword_match_type?: string | null
          quality_score?: number | null
          roas?: number | null
          search_impression_share?: number | null
          utm_campaign?: string | null
          utm_content?: string | null
        }
        Relationships: []
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
      meta_ads_spend: {
        Row: {
          account_id: string | null
          ad_id: string | null
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          clicks: number | null
          conversion_value: number | null
          conversions: number | null
          cost_per_lead: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          date: string
          frequency: number | null
          id: number
          impressions: number | null
          leads: number | null
          objective: string | null
          placement: string | null
          reach: number | null
          roas: number | null
          spend: number | null
          unique_clicks: number | null
          utm_campaign: string | null
          utm_content: string | null
          video_views: number | null
        }
        Insert: {
          account_id?: string | null
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number | null
          conversion_value?: number | null
          conversions?: number | null
          cost_per_lead?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          frequency?: number | null
          id?: number
          impressions?: number | null
          leads?: number | null
          objective?: string | null
          placement?: string | null
          reach?: number | null
          roas?: number | null
          spend?: number | null
          unique_clicks?: number | null
          utm_campaign?: string | null
          utm_content?: string | null
          video_views?: number | null
        }
        Update: {
          account_id?: string | null
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          clicks?: number | null
          conversion_value?: number | null
          conversions?: number | null
          cost_per_lead?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          frequency?: number | null
          id?: number
          impressions?: number | null
          leads?: number | null
          objective?: string | null
          placement?: string | null
          reach?: number | null
          roas?: number | null
          spend?: number | null
          unique_clicks?: number | null
          utm_campaign?: string | null
          utm_content?: string | null
          video_views?: number | null
        }
        Relationships: []
      }
      meta_pipeline: {
        Row: {
          k: string
          updated_at: string
          v: Json | null
        }
        Insert: {
          k: string
          updated_at?: string
          v?: Json | null
        }
        Update: {
          k?: string
          updated_at?: string
          v?: Json | null
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
      planilha_imports: {
        Row: {
          aba: string
          created_at: string
          created_by: string | null
          erro: string | null
          id: string
          linhas_atualizadas: number
          linhas_inseridas: number
          sheet_url: string
          status: string
        }
        Insert: {
          aba: string
          created_at?: string
          created_by?: string | null
          erro?: string | null
          id?: string
          linhas_atualizadas?: number
          linhas_inseridas?: number
          sheet_url: string
          status?: string
        }
        Update: {
          aba?: string
          created_at?: string
          created_by?: string | null
          erro?: string | null
          id?: string
          linhas_atualizadas?: number
          linhas_inseridas?: number
          sheet_url?: string
          status?: string
        }
        Relationships: []
      }
      planilha_leads: {
        Row: {
          canal: string | null
          data_lead: string | null
          email: string | null
          id: number
          import_batch_id: string | null
          imported_at: string
          nome: string | null
          origem_lead: string | null
          raw: Json | null
          telefone: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          canal?: string | null
          data_lead?: string | null
          email?: string | null
          id?: number
          import_batch_id?: string | null
          imported_at?: string
          nome?: string | null
          origem_lead?: string | null
          raw?: Json | null
          telefone?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          canal?: string | null
          data_lead?: string | null
          email?: string | null
          id?: number
          import_batch_id?: string | null
          imported_at?: string
          nome?: string | null
          origem_lead?: string | null
          raw?: Json | null
          telefone?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planilha_leads_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "planilha_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      planilha_vendas: {
        Row: {
          canal: string | null
          cidade: string | null
          data_matricula: string | null
          dias_lead_para_venda: number | null
          email: string | null
          estado: string | null
          id: number
          import_batch_id: string | null
          imported_at: string
          lead_data: string | null
          lead_id: number | null
          nome: string | null
          raw: Json | null
          telefone: string | null
          turma: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valor_convertido: number | null
        }
        Insert: {
          canal?: string | null
          cidade?: string | null
          data_matricula?: string | null
          dias_lead_para_venda?: number | null
          email?: string | null
          estado?: string | null
          id?: number
          import_batch_id?: string | null
          imported_at?: string
          lead_data?: string | null
          lead_id?: number | null
          nome?: string | null
          raw?: Json | null
          telefone?: string | null
          turma?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_convertido?: number | null
        }
        Update: {
          canal?: string | null
          cidade?: string | null
          data_matricula?: string | null
          dias_lead_para_venda?: number | null
          email?: string | null
          estado?: string | null
          id?: number
          import_batch_id?: string | null
          imported_at?: string
          lead_data?: string | null
          lead_id?: number | null
          nome?: string | null
          raw?: Json | null
          telefone?: string | null
          turma?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_convertido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "planilha_vendas_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "planilha_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planilha_vendas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "planilha_leads"
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
      rd_leads: {
        Row: {
          canal: string | null
          cidade: string | null
          data_criacao: string | null
          email: string | null
          estado: string | null
          id: number
          id_lead_rd: string | null
          import_batch_id: string | null
          imported_at: string
          nome: string | null
          objecoes: string | null
          origem_lead: string | null
          proprietario: string | null
          raw: Json | null
          status_lead: string | null
          telefone: string | null
          unidade_rd: string | null
          url_cadastro: string | null
          utm_campanha: string | null
          utm_conteudo: string | null
          utm_midia: string | null
          utm_origem: string | null
          utm_termo: string | null
        }
        Insert: {
          canal?: string | null
          cidade?: string | null
          data_criacao?: string | null
          email?: string | null
          estado?: string | null
          id?: number
          id_lead_rd?: string | null
          import_batch_id?: string | null
          imported_at?: string
          nome?: string | null
          objecoes?: string | null
          origem_lead?: string | null
          proprietario?: string | null
          raw?: Json | null
          status_lead?: string | null
          telefone?: string | null
          unidade_rd?: string | null
          url_cadastro?: string | null
          utm_campanha?: string | null
          utm_conteudo?: string | null
          utm_midia?: string | null
          utm_origem?: string | null
          utm_termo?: string | null
        }
        Update: {
          canal?: string | null
          cidade?: string | null
          data_criacao?: string | null
          email?: string | null
          estado?: string | null
          id?: number
          id_lead_rd?: string | null
          import_batch_id?: string | null
          imported_at?: string
          nome?: string | null
          objecoes?: string | null
          origem_lead?: string | null
          proprietario?: string | null
          raw?: Json | null
          status_lead?: string | null
          telefone?: string | null
          unidade_rd?: string | null
          url_cadastro?: string | null
          utm_campanha?: string | null
          utm_conteudo?: string | null
          utm_midia?: string | null
          utm_origem?: string | null
          utm_termo?: string | null
        }
        Relationships: []
      }
      rd_vendas: {
        Row: {
          canal_venda: string | null
          checkout: string | null
          cidade: string | null
          codigo_curso: string | null
          codigo_unidade: string | null
          curso: string | null
          data_aprovacao: string | null
          data_criacao: string | null
          data_matricula: string | null
          data_nascimento: string | null
          email: string | null
          estado: string | null
          fase: string | null
          id: number
          id_venda: string | null
          import_batch_id: string | null
          imported_at: string
          lead_origem: string | null
          mes_venda: string | null
          nome_cliente: string | null
          nome_venda: string | null
          origem_lead: string | null
          pacote: string | null
          promocao: string | null
          proprietario: string | null
          qtd_pagantes: number | null
          qtd_parcelas: number | null
          raw: Json | null
          sexo: string | null
          telefone: string | null
          turma: string | null
          ultima_origem_lead: string | null
          unidade_geradora: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_gclid: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valor: number | null
          valor_convertido: number | null
          valor_moeda: string | null
          venda_pai: string | null
        }
        Insert: {
          canal_venda?: string | null
          checkout?: string | null
          cidade?: string | null
          codigo_curso?: string | null
          codigo_unidade?: string | null
          curso?: string | null
          data_aprovacao?: string | null
          data_criacao?: string | null
          data_matricula?: string | null
          data_nascimento?: string | null
          email?: string | null
          estado?: string | null
          fase?: string | null
          id?: number
          id_venda?: string | null
          import_batch_id?: string | null
          imported_at?: string
          lead_origem?: string | null
          mes_venda?: string | null
          nome_cliente?: string | null
          nome_venda?: string | null
          origem_lead?: string | null
          pacote?: string | null
          promocao?: string | null
          proprietario?: string | null
          qtd_pagantes?: number | null
          qtd_parcelas?: number | null
          raw?: Json | null
          sexo?: string | null
          telefone?: string | null
          turma?: string | null
          ultima_origem_lead?: string | null
          unidade_geradora?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_gclid?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor?: number | null
          valor_convertido?: number | null
          valor_moeda?: string | null
          venda_pai?: string | null
        }
        Update: {
          canal_venda?: string | null
          checkout?: string | null
          cidade?: string | null
          codigo_curso?: string | null
          codigo_unidade?: string | null
          curso?: string | null
          data_aprovacao?: string | null
          data_criacao?: string | null
          data_matricula?: string | null
          data_nascimento?: string | null
          email?: string | null
          estado?: string | null
          fase?: string | null
          id?: number
          id_venda?: string | null
          import_batch_id?: string | null
          imported_at?: string
          lead_origem?: string | null
          mes_venda?: string | null
          nome_cliente?: string | null
          nome_venda?: string | null
          origem_lead?: string | null
          pacote?: string | null
          promocao?: string | null
          proprietario?: string | null
          qtd_pagantes?: number | null
          qtd_parcelas?: number | null
          raw?: Json | null
          sexo?: string | null
          telefone?: string | null
          turma?: string | null
          ultima_origem_lead?: string | null
          unidade_geradora?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_gclid?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor?: number | null
          valor_convertido?: number | null
          valor_moeda?: string | null
          venda_pai?: string | null
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
    }
    Views: {
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
      vendas_atribuidas: {
        Row: {
          canal: string | null
          canal_venda: string | null
          cidade: string | null
          created_at: string | null
          data_aprovacao: string | null
          data_matricula: string | null
          data_venda: string | null
          email: string | null
          estado: string | null
          fase: string | null
          fonte_atribuicao: string | null
          id: string | null
          id_venda: string | null
          lead_data_criacao: string | null
          lead_id: string | null
          lead_utm_campaign: string | null
          lead_utm_content: string | null
          lead_utm_medium: string | null
          lead_utm_source: string | null
          match_lag_days: number | null
          match_score: number | null
          nome: string | null
          origem_lead: string | null
          origem_principal: string | null
          origem_secundaria: string | null
          pacote: string | null
          proprietario: string | null
          qtd_pagantes: number | null
          qtd_parcelas: number | null
          tipo_atribuicao: string | null
          tipo_match: string | null
          turma: string | null
          ultima_origem_lead: string | null
          utm_campanha: string | null
          utm_conteudo: string | null
          utm_midia: string | null
          utm_origem: string | null
          utm_termo: string | null
          valor: number | null
          valor_convertido: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _qb_agg_expr: {
        Args: { p_bring: Json; p_table: string }
        Returns: string
      }
      _qb_assert_col: {
        Args: { p_col: string; p_table: string }
        Returns: undefined
      }
      _qb_filter_expr: {
        Args: { p_base: string; p_filter: Json; p_join_aliases: Json }
        Returns: string
      }
      derive_canal: {
        Args: {
          p_origem: string
          p_ultima_origem?: string
          p_utm_medium: string
          p_utm_source: string
        }
        Returns: string
      }
      derive_canal_v2: {
        Args: { p_origem: string; p_ultima_origem: string }
        Returns: string
      }
      exec_read_sql: { Args: { p_sql: string }; Returns: Json }
      get_canais_breakdown: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_estados?: string[]
          p_turmas?: string[]
        }
        Returns: {
          canal: string
          receita: number
          ticket: number
          vendas: number
        }[]
      }
      get_vendas_agg: {
        Args: {
          p_canais?: string[]
          p_date_from?: string
          p_date_to?: string
          p_estados?: string[]
          p_search?: string
          p_tipo?: string
          p_turmas?: string[]
        }
        Returns: {
          com_lead_count: number
          receita_sum: number
          total_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_valid_email: { Args: { p: string }; Returns: boolean }
      is_valid_phone: { Args: { p: string }; Returns: boolean }
      norm_email: { Args: { p: string }; Returns: string }
      norm_nome: { Args: { p: string }; Returns: string }
      norm_phone: { Args: { p: string }; Returns: string }
      query_builder: { Args: { p_query: Json }; Returns: Json }
      query_builder_meta: { Args: never; Returns: Json }
      rebuild_core: { Args: never; Returns: Json }
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
