CREATE OR REPLACE VIEW public.vendas_atribuidas AS
SELECT v.venda_id::text AS id,
    v.id_venda, v.email, v.nome, v.turma, v.pacote, v.fase, v.proprietario, v.canal_venda,
    v.data_criacao AS data_venda, v.data_aprovacao, v.data_matricula,
    v.valor, v.valor_convertido, v.qtd_pagantes, v.qtd_parcelas, v.estado, v.cidade,
    COALESCE(NULLIF(v.utm_source, ''), l.utm_source)   AS utm_origem,
    COALESCE(NULLIF(v.utm_medium, ''), l.utm_medium)   AS utm_midia,
    COALESCE(NULLIF(v.utm_campaign,''), l.utm_campaign) AS utm_campanha,
    COALESCE(NULLIF(v.utm_content, ''), l.utm_content) AS utm_conteudo,
    COALESCE(NULLIF(v.utm_term,    ''), l.utm_term)    AS utm_termo,
    derive_canal(
      COALESCE(NULLIF(v.utm_source,''), l.utm_source),
      COALESCE(NULLIF(v.utm_medium,''), l.utm_medium),
      COALESCE(v.origem_lead, l.origem_lead),
      v.ultima_origem_lead
    ) AS canal,
    v.origem_lead, v.ultima_origem_lead,
    l.lead_id::text AS lead_id, l.data_lead AS lead_data_criacao,
    COALESCE(b.match_method, 'sem') AS tipo_match,
    COALESCE(b.match_score, 0::numeric) AS match_score,
    b.match_lag_days,
    CASE
      WHEN b.lead_id IS NOT NULL AND b.is_pre_sale THEN 'Lead Anterior'
      WHEN b.lead_id IS NOT NULL THEN 'Lead Posterior'
      WHEN COALESCE(NULLIF(v.utm_source,''), l.utm_source) IS NOT NULL THEN 'UTM Direta'
      ELSE 'Sem Atribuição'
    END AS tipo_atribuicao,
    v.created_at
FROM fct_venda v
LEFT JOIN bridge_lead_venda b ON b.venda_id = v.venda_id AND b.is_primary
LEFT JOIN fct_lead l ON l.lead_id = b.lead_id;

CREATE INDEX IF NOT EXISTS idx_fct_venda_data_matricula ON public.fct_venda(data_matricula);
CREATE INDEX IF NOT EXISTS idx_fct_venda_estado ON public.fct_venda(estado);
CREATE INDEX IF NOT EXISTS idx_fct_venda_turma ON public.fct_venda(turma);
CREATE INDEX IF NOT EXISTS idx_fct_venda_email_key ON public.fct_venda(email_key);
CREATE INDEX IF NOT EXISTS idx_fct_venda_phone_key ON public.fct_venda(phone_key);
CREATE INDEX IF NOT EXISTS idx_fct_lead_email_key ON public.fct_lead(email_key);
CREATE INDEX IF NOT EXISTS idx_fct_lead_phone_key ON public.fct_lead(phone_key);
CREATE INDEX IF NOT EXISTS idx_bridge_primary ON public.bridge_lead_venda(venda_id) WHERE is_primary;

CREATE OR REPLACE FUNCTION public.get_canais_breakdown(
  p_date_from text DEFAULT NULL,
  p_date_to   text DEFAULT NULL,
  p_turmas    text[] DEFAULT NULL,
  p_estados   text[] DEFAULT NULL
) RETURNS TABLE(canal text, vendas bigint, receita numeric, ticket numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT va.canal,
         COUNT(*)::bigint,
         COALESCE(SUM(va.valor_convertido),0),
         CASE WHEN COUNT(*)>0 THEN COALESCE(SUM(va.valor_convertido),0)/COUNT(*) ELSE 0 END
  FROM public.vendas_atribuidas va
  WHERE (p_date_from IS NULL OR p_date_from='' OR va.data_matricula >= p_date_from::date)
    AND (p_date_to   IS NULL OR p_date_to=''   OR va.data_matricula <= p_date_to::date)
    AND (p_turmas  IS NULL OR cardinality(p_turmas)=0  OR va.turma=ANY(p_turmas))
    AND (p_estados IS NULL OR cardinality(p_estados)=0 OR va.estado=ANY(p_estados))
  GROUP BY va.canal
  ORDER BY 3 DESC NULLS LAST;
END $$;