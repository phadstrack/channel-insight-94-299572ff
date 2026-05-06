-- Remove tabela antiga e a view temporária v2
DROP TABLE IF EXISTS public.vendas_atribuidas CASCADE;
DROP VIEW  IF EXISTS public.vendas_atribuidas_v2 CASCADE;

-- Recria como VIEW com security_invoker (respeita RLS do chamador)
CREATE VIEW public.vendas_atribuidas
WITH (security_invoker = true)
AS
WITH last_lead AS (
  SELECT DISTINCT ON (lower(email))
    lower(email) AS email_key,
    id AS lead_id, status_lead, origem_lead AS lead_origem_rd,
    utm_origem  AS l_utm_origem,
    utm_midia   AS l_utm_midia,
    utm_campanha AS l_utm_campanha,
    utm_conteudo AS l_utm_conteudo,
    utm_termo    AS l_utm_termo,
    canal AS canal_lead,
    data_criacao AS lead_data_criacao
  FROM public.rd_leads
  WHERE email IS NOT NULL AND email <> ''
  ORDER BY lower(email), data_criacao DESC NULLS LAST
)
SELECT
  v.id,
  v.id_venda,
  v.email,
  v.nome_cliente AS nome,
  v.turma,
  v.pacote,
  v.fase,
  v.proprietario,
  v.canal_venda,
  v.data_criacao    AS data_venda,
  v.data_aprovacao,
  COALESCE(v.data_matricula::date, v.data_aprovacao::date, v.data_criacao::date) AS data_matricula,
  v.valor,
  v.valor_convertido,
  v.qtd_pagantes,
  v.qtd_parcelas,
  v.estado,
  v.cidade,
  COALESCE(NULLIF(v.utm_source,''),  l.l_utm_origem)   AS utm_origem,
  COALESCE(NULLIF(v.utm_medium,''),  l.l_utm_midia)    AS utm_midia,
  COALESCE(NULLIF(v.utm_campaign,''),l.l_utm_campanha) AS utm_campanha,
  COALESCE(NULLIF(v.utm_content,''), l.l_utm_conteudo) AS utm_conteudo,
  COALESCE(NULLIF(v.utm_term,''),    l.l_utm_termo)    AS utm_termo,
  COALESCE(l.canal_lead, 'Sem Atribuição') AS canal,
  v.origem_lead,
  v.ultima_origem_lead,
  l.lead_id,
  l.lead_data_criacao,
  CASE
    WHEN l.lead_id IS NULL THEN 'Sem Atribuicao'
    WHEN v.utm_source IS NOT NULL AND v.utm_source <> '' THEN 'Existente'
    ELSE 'Inferida'
  END AS tipo_atribuicao,
  v.imported_at AS created_at
FROM public.rd_vendas v
LEFT JOIN last_lead l ON l.email_key = lower(v.email);

-- Recria RPC apontando para a nova view
CREATE OR REPLACE FUNCTION public.get_vendas_agg(
  p_date_from text DEFAULT NULL, p_date_to text DEFAULT NULL,
  p_turmas text[] DEFAULT NULL, p_estados text[] DEFAULT NULL,
  p_canais text[] DEFAULT NULL, p_search text DEFAULT NULL, p_tipo text DEFAULT NULL
) RETURNS TABLE(total_count bigint, receita_sum numeric, com_lead_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT,
         COALESCE(SUM(valor_convertido),0),
         COUNT(*) FILTER (WHERE tipo_atribuicao IN ('Existente','Inferida'))::BIGINT
  FROM public.vendas_atribuidas
  WHERE (p_date_from IS NULL OR p_date_from='' OR data_matricula >= p_date_from::date)
    AND (p_date_to   IS NULL OR p_date_to=''   OR data_matricula <= p_date_to::date)
    AND (p_turmas  IS NULL OR cardinality(p_turmas)=0  OR turma=ANY(p_turmas))
    AND (p_estados IS NULL OR cardinality(p_estados)=0 OR estado=ANY(p_estados))
    AND (p_canais  IS NULL OR cardinality(p_canais)=0  OR canal=ANY(p_canais))
    AND (p_search  IS NULL OR p_search='' OR nome ILIKE '%'||p_search||'%' OR email ILIKE '%'||p_search||'%')
    AND (p_tipo IS NULL OR p_tipo='' OR p_tipo='Todas'
         OR (p_tipo='Com Lead' AND tipo_atribuicao IN ('Existente','Inferida'))
         OR (p_tipo='Sem Atribuicao' AND tipo_atribuicao='Sem Atribuicao'));
END; $$;