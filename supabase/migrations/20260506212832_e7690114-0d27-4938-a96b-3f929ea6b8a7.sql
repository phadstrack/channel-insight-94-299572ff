
CREATE OR REPLACE FUNCTION public.norm_email(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(lower(btrim(coalesce(p,''))), '')
$$;

CREATE OR REPLACE FUNCTION public.norm_phone(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(RIGHT(regexp_replace(coalesce(p,''), '\D','','g'), 10), '')
$$;

CREATE INDEX IF NOT EXISTS idx_rd_leads_norm_email ON public.rd_leads (public.norm_email(email));
CREATE INDEX IF NOT EXISTS idx_rd_leads_norm_phone ON public.rd_leads (public.norm_phone(telefone));
CREATE INDEX IF NOT EXISTS idx_planilha_leads_norm_email ON public.planilha_leads (public.norm_email(email));
CREATE INDEX IF NOT EXISTS idx_planilha_leads_norm_phone ON public.planilha_leads (public.norm_phone(telefone));
CREATE INDEX IF NOT EXISTS idx_rd_vendas_norm_email ON public.rd_vendas (public.norm_email(email));
CREATE INDEX IF NOT EXISTS idx_rd_vendas_norm_phone ON public.rd_vendas (public.norm_phone(telefone));

DROP VIEW IF EXISTS public.vendas_atribuidas;

CREATE VIEW public.vendas_atribuidas AS
WITH leads_all AS (
  SELECT
    public.norm_email(email) AS email_key,
    public.norm_phone(telefone) AS phone_key,
    id::text AS lead_id,
    status_lead,
    origem_lead AS lead_origem_rd,
    utm_origem  AS l_utm_origem,
    utm_midia   AS l_utm_midia,
    utm_campanha AS l_utm_campanha,
    utm_conteudo AS l_utm_conteudo,
    utm_termo    AS l_utm_termo,
    canal        AS canal_lead,
    data_criacao AS lead_data_criacao
  FROM public.rd_leads
  UNION ALL
  SELECT
    public.norm_email(email) AS email_key,
    public.norm_phone(telefone) AS phone_key,
    id::text AS lead_id,
    NULL::text AS status_lead,
    origem_lead AS lead_origem_rd,
    utm_source  AS l_utm_origem,
    utm_medium  AS l_utm_midia,
    utm_campaign AS l_utm_campanha,
    utm_content  AS l_utm_conteudo,
    utm_term     AS l_utm_termo,
    canal        AS canal_lead,
    data_lead::timestamptz AS lead_data_criacao
  FROM public.planilha_leads
),
match_email AS (
  SELECT DISTINCT ON (email_key) *
  FROM leads_all
  WHERE email_key IS NOT NULL
  ORDER BY email_key, lead_data_criacao DESC NULLS LAST
),
match_phone AS (
  SELECT DISTINCT ON (phone_key) *
  FROM leads_all
  WHERE phone_key IS NOT NULL
  ORDER BY phone_key, lead_data_criacao DESC NULLS LAST
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
  v.data_criacao   AS data_venda,
  v.data_aprovacao,
  COALESCE(v.data_matricula::date, v.data_aprovacao::date, v.data_criacao::date) AS data_matricula,
  v.valor,
  v.valor_convertido,
  v.qtd_pagantes,
  v.qtd_parcelas,
  v.estado,
  v.cidade,
  COALESCE(NULLIF(v.utm_source,'')  , me.l_utm_origem  , mp.l_utm_origem)   AS utm_origem,
  COALESCE(NULLIF(v.utm_medium,'')  , me.l_utm_midia   , mp.l_utm_midia)    AS utm_midia,
  COALESCE(NULLIF(v.utm_campaign,''), me.l_utm_campanha, mp.l_utm_campanha) AS utm_campanha,
  COALESCE(NULLIF(v.utm_content,'') , me.l_utm_conteudo, mp.l_utm_conteudo) AS utm_conteudo,
  COALESCE(NULLIF(v.utm_term,'')    , me.l_utm_termo   , mp.l_utm_termo)    AS utm_termo,
  COALESCE(me.canal_lead, mp.canal_lead, 'Sem Atribuição') AS canal,
  v.origem_lead,
  v.ultima_origem_lead,
  COALESCE(me.lead_id, mp.lead_id) AS lead_id,
  COALESCE(me.lead_data_criacao, mp.lead_data_criacao) AS lead_data_criacao,
  CASE
    WHEN me.lead_id IS NOT NULL THEN 'email'
    WHEN mp.lead_id IS NOT NULL THEN 'telefone'
    ELSE 'sem'
  END AS tipo_match,
  CASE
    WHEN COALESCE(me.lead_id, mp.lead_id) IS NULL THEN 'Sem Atribuicao'
    WHEN v.utm_source IS NOT NULL AND v.utm_source <> '' THEN 'Existente'
    ELSE 'Inferida'
  END AS tipo_atribuicao,
  v.imported_at AS created_at
FROM public.rd_vendas v
LEFT JOIN match_email me ON me.email_key = public.norm_email(v.email)
LEFT JOIN match_phone mp
  ON me.lead_id IS NULL
 AND mp.phone_key = public.norm_phone(v.telefone);
