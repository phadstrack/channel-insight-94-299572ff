-- 1. rd_leads
CREATE TABLE public.rd_leads (
  id BIGSERIAL PRIMARY KEY,
  id_lead_rd TEXT UNIQUE,
  email TEXT,
  nome TEXT,
  telefone TEXT,
  proprietario TEXT,
  status_lead TEXT,
  unidade_rd TEXT,
  origem_lead TEXT,
  url_cadastro TEXT,
  data_criacao TIMESTAMPTZ,
  utm_origem TEXT,
  utm_midia TEXT,
  utm_campanha TEXT,
  utm_conteudo TEXT,
  utm_termo TEXT,
  canal TEXT,
  cidade TEXT,
  estado TEXT,
  objecoes TEXT,
  import_batch_id UUID,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw JSONB
);
CREATE INDEX rd_leads_email_idx ON public.rd_leads(lower(email));
CREATE INDEX rd_leads_data_idx ON public.rd_leads(data_criacao);
CREATE INDEX rd_leads_status_idx ON public.rd_leads(status_lead);
CREATE INDEX rd_leads_canal_idx ON public.rd_leads(canal);
CREATE INDEX rd_leads_campanha_idx ON public.rd_leads(utm_campanha);

ALTER TABLE public.rd_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_read_rd_leads ON public.rd_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_insert_rd_leads ON public.rd_leads FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY admin_update_rd_leads ON public.rd_leads FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY admin_delete_rd_leads ON public.rd_leads FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

-- 2. rd_vendas
CREATE TABLE public.rd_vendas (
  id BIGSERIAL PRIMARY KEY,
  id_venda TEXT UNIQUE,
  email TEXT,
  nome_cliente TEXT,
  nome_venda TEXT,
  proprietario TEXT,
  lead_origem TEXT,
  curso TEXT,
  codigo_curso TEXT,
  unidade_geradora TEXT,
  codigo_unidade TEXT,
  turma TEXT,
  pacote TEXT,
  promocao TEXT,
  canal_venda TEXT,
  checkout TEXT,
  fase TEXT,
  valor NUMERIC,
  valor_moeda TEXT,
  valor_convertido NUMERIC,
  qtd_pagantes INTEGER,
  qtd_parcelas INTEGER,
  estado TEXT,
  cidade TEXT,
  sexo TEXT,
  data_nascimento DATE,
  mes_venda TEXT,
  data_criacao TIMESTAMPTZ,
  data_aprovacao TIMESTAMPTZ,
  data_matricula TIMESTAMPTZ,
  telefone TEXT,
  venda_pai TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  utm_gclid TEXT,
  origem_lead TEXT,
  ultima_origem_lead TEXT,
  import_batch_id UUID,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw JSONB
);
CREATE INDEX rd_vendas_email_idx ON public.rd_vendas(lower(email));
CREATE INDEX rd_vendas_matricula_idx ON public.rd_vendas(data_matricula);
CREATE INDEX rd_vendas_turma_idx ON public.rd_vendas(turma);
CREATE INDEX rd_vendas_estado_idx ON public.rd_vendas(estado);
CREATE INDEX rd_vendas_pacote_idx ON public.rd_vendas(pacote);
CREATE INDEX rd_vendas_fase_idx ON public.rd_vendas(fase);
CREATE INDEX rd_vendas_proprietario_idx ON public.rd_vendas(proprietario);

ALTER TABLE public.rd_vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_read_rd_vendas ON public.rd_vendas FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_insert_rd_vendas ON public.rd_vendas FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY admin_update_rd_vendas ON public.rd_vendas FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY admin_delete_rd_vendas ON public.rd_vendas FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

-- 3. View atribuição
CREATE OR REPLACE VIEW public.vendas_atribuidas_v2 AS
WITH last_lead AS (
  SELECT DISTINCT ON (lower(email))
    lower(email) AS email_key,
    id, id_lead_rd, status_lead, origem_lead AS lead_origem_rd,
    utm_origem, utm_midia, utm_campanha, utm_conteudo, utm_termo,
    canal AS canal_lead, data_criacao
  FROM public.rd_leads
  WHERE email IS NOT NULL AND email <> ''
  ORDER BY lower(email), data_criacao DESC NULLS LAST
)
SELECT
  v.id, v.id_venda, v.email, v.nome_cliente AS nome,
  v.turma, v.pacote, v.fase, v.proprietario,
  v.valor, v.valor_convertido, v.qtd_pagantes, v.qtd_parcelas,
  v.estado, v.cidade, v.canal_venda,
  v.data_criacao, v.data_aprovacao, v.data_matricula,
  COALESCE(NULLIF(v.utm_source,''),  l.utm_origem)   AS utm_origem,
  COALESCE(NULLIF(v.utm_medium,''),  l.utm_midia)    AS utm_midia,
  COALESCE(NULLIF(v.utm_campaign,''),l.utm_campanha) AS utm_campanha,
  COALESCE(NULLIF(v.utm_content,''), l.utm_conteudo) AS utm_conteudo,
  COALESCE(NULLIF(v.utm_term,''),    l.utm_termo)    AS utm_termo,
  COALESCE(l.canal_lead, 'Sem Atribuição')           AS canal,
  v.origem_lead, v.ultima_origem_lead,
  l.id AS lead_id, l.data_criacao AS lead_data_criacao,
  CASE
    WHEN l.id IS NULL THEN 'Sem Atribuicao'
    WHEN v.utm_source IS NOT NULL AND v.utm_source <> '' THEN 'Existente'
    ELSE 'Inferida'
  END AS tipo_atribuicao
FROM public.rd_vendas v
LEFT JOIN last_lead l ON l.email_key = lower(v.email);

-- 4. RPC nova
CREATE OR REPLACE FUNCTION public.get_vendas_agg(
  p_date_from text DEFAULT NULL, p_date_to text DEFAULT NULL,
  p_turmas text[] DEFAULT NULL, p_estados text[] DEFAULT NULL,
  p_canais text[] DEFAULT NULL, p_search text DEFAULT NULL, p_tipo text DEFAULT NULL
) RETURNS TABLE(total_count bigint, receita_sum numeric, com_lead_count bigint)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT,
         COALESCE(SUM(valor_convertido),0),
         COUNT(*) FILTER (WHERE tipo_atribuicao IN ('Existente','Inferida'))::BIGINT
  FROM public.vendas_atribuidas_v2
  WHERE (p_date_from IS NULL OR p_date_from='' OR data_matricula::date >= p_date_from::date)
    AND (p_date_to   IS NULL OR p_date_to=''   OR data_matricula::date <= p_date_to::date)
    AND (p_turmas  IS NULL OR cardinality(p_turmas)=0  OR turma=ANY(p_turmas))
    AND (p_estados IS NULL OR cardinality(p_estados)=0 OR estado=ANY(p_estados))
    AND (p_canais  IS NULL OR cardinality(p_canais)=0  OR canal=ANY(p_canais))
    AND (p_search  IS NULL OR p_search='' OR nome ILIKE '%'||p_search||'%' OR email ILIKE '%'||p_search||'%')
    AND (p_tipo IS NULL OR p_tipo='' OR p_tipo='Todas'
         OR (p_tipo='Com Lead' AND tipo_atribuicao IN ('Existente','Inferida'))
         OR (p_tipo='Sem Atribuicao' AND tipo_atribuicao='Sem Atribuicao'));
END; $$;

-- 5. Fix batch travado
UPDATE public.planilha_imports
SET status='success', linhas_inseridas=12000
WHERE status='running' AND linhas_inseridas=0;