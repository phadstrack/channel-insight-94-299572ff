
-- ============================================================
-- 1. Funções utilitárias
-- ============================================================
CREATE OR REPLACE FUNCTION public.norm_nome(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(
    regexp_replace(
      lower(translate(coalesce(p,''),
        'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
        'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'
      )),
      '[^a-z0-9 ]+', ' ', 'g'
    ),
    ''
  )
$$;

CREATE OR REPLACE FUNCTION public.is_valid_email(p text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT p IS NOT NULL AND p ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
$$;

CREATE OR REPLACE FUNCTION public.is_valid_phone(p text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT length(regexp_replace(coalesce(p,''),'\D','','g')) >= 10
     AND regexp_replace(coalesce(p,''),'\D','','g') !~ '^(\d)\1+$'
$$;

-- ============================================================
-- 2. Tabelas CORE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dim_pessoa (
  pessoa_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_key text,
  phone_key text,
  nome_key text,
  email text,
  telefone text,
  nome text,
  estado text,
  cidade text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dim_pessoa_email_key ON public.dim_pessoa(email_key) WHERE email_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dim_pessoa_phone_key ON public.dim_pessoa(phone_key) WHERE phone_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dim_pessoa_nome_key ON public.dim_pessoa(nome_key) WHERE nome_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.fct_venda (
  venda_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id uuid REFERENCES public.dim_pessoa(pessoa_id) ON DELETE SET NULL,
  source text NOT NULL,
  source_id text,
  id_venda text,
  email text,
  telefone text,
  nome text,
  email_key text,
  phone_key text,
  nome_key text,
  estado text,
  cidade text,
  turma text,
  pacote text,
  fase text,
  proprietario text,
  canal_venda text,
  curso text,
  valor numeric,
  valor_moeda text,
  valor_convertido numeric,
  qtd_pagantes int,
  qtd_parcelas int,
  data_criacao timestamptz,
  data_aprovacao timestamptz,
  data_matricula date,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  origem_lead text,
  ultima_origem_lead text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fct_venda_pessoa ON public.fct_venda(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_fct_venda_data_matricula ON public.fct_venda(data_matricula);
CREATE INDEX IF NOT EXISTS idx_fct_venda_email_key ON public.fct_venda(email_key) WHERE email_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fct_venda_phone_key ON public.fct_venda(phone_key) WHERE phone_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fct_venda_turma ON public.fct_venda(turma);

CREATE TABLE IF NOT EXISTS public.fct_lead (
  lead_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id uuid REFERENCES public.dim_pessoa(pessoa_id) ON DELETE SET NULL,
  source text NOT NULL,
  source_id text,
  email text,
  telefone text,
  nome text,
  email_key text,
  phone_key text,
  nome_key text,
  estado text,
  cidade text,
  origem_lead text,
  canal text,
  status_lead text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  data_lead timestamptz,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fct_lead_pessoa ON public.fct_lead(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_fct_lead_email_key ON public.fct_lead(email_key) WHERE email_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fct_lead_phone_key ON public.fct_lead(phone_key) WHERE phone_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fct_lead_data ON public.fct_lead(data_lead);

CREATE TABLE IF NOT EXISTS public.bridge_lead_venda (
  id bigserial PRIMARY KEY,
  venda_id uuid NOT NULL REFERENCES public.fct_venda(venda_id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.fct_lead(lead_id) ON DELETE CASCADE,
  match_method text NOT NULL,
  match_score numeric NOT NULL,
  match_lag_days int,
  is_pre_sale boolean NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(venda_id, lead_id)
);
CREATE INDEX IF NOT EXISTS idx_bridge_venda ON public.bridge_lead_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_bridge_lead ON public.bridge_lead_venda(lead_id);
CREATE INDEX IF NOT EXISTS idx_bridge_primary ON public.bridge_lead_venda(venda_id) WHERE is_primary;

CREATE TABLE IF NOT EXISTS public.dq_findings (
  id bigserial PRIMARY KEY,
  entity text NOT NULL,
  entity_id text,
  rule text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info','warn','error')),
  details jsonb,
  batch_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dq_rule ON public.dq_findings(rule);
CREATE INDEX IF NOT EXISTS idx_dq_severity ON public.dq_findings(severity);
CREATE INDEX IF NOT EXISTS idx_dq_entity ON public.dq_findings(entity, entity_id);

CREATE TABLE IF NOT EXISTS public.dq_resolutions (
  id bigserial PRIMARY KEY,
  finding_id bigint REFERENCES public.dq_findings(id) ON DELETE CASCADE,
  rule text,
  entity text,
  entity_id text,
  resolved_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meta_pipeline (
  k text PRIMARY KEY,
  v jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. RLS
-- ============================================================
ALTER TABLE public.dim_pessoa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fct_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fct_lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bridge_lead_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jornada_normalizada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ads_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sem_atribuicao ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['dim_pessoa','fct_venda','fct_lead','bridge_lead_venda','dq_findings','dq_resolutions','meta_pipeline','jornada_normalizada','meta_ads_spend','google_ads_spend','sem_atribuicao']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS auth_read_%1$s ON public.%1$s', t);
    EXECUTE format('CREATE POLICY auth_read_%1$s ON public.%1$s FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS admin_write_%1$s ON public.%1$s', t);
    EXECUTE format('CREATE POLICY admin_write_%1$s ON public.%1$s FOR ALL TO authenticated USING (has_role(auth.uid(),''admin''::app_role)) WITH CHECK (has_role(auth.uid(),''admin''::app_role))', t);
  END LOOP;
END $$;

-- Política específica: usuários podem inserir suas próprias resoluções
DROP POLICY IF EXISTS user_insert_dq_resolutions ON public.dq_resolutions;
CREATE POLICY user_insert_dq_resolutions ON public.dq_resolutions
  FOR INSERT TO authenticated WITH CHECK (resolved_by = auth.uid());

-- ============================================================
-- 4. Procedure de rebuild do core
-- ============================================================
CREATE OR REPLACE FUNCTION public.rebuild_core()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch uuid := gen_random_uuid();
  v_pessoas int; v_vendas int; v_leads int; v_bridges int; v_dq int;
BEGIN
  -- Apenas admins podem rebuildar
  IF NOT has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas admins podem rebuildar o core';
  END IF;

  -- Limpa core (rebuild full — ok até ~100k linhas)
  TRUNCATE public.bridge_lead_venda RESTART IDENTITY;
  TRUNCATE public.fct_venda CASCADE;
  TRUNCATE public.fct_lead CASCADE;
  TRUNCATE public.dim_pessoa CASCADE;
  DELETE FROM public.dq_findings WHERE batch_id IS NULL OR batch_id <> v_batch;

  -- ----- 4.1 dim_pessoa: união de chaves
  WITH src AS (
    SELECT norm_email(email) ek, norm_phone(telefone) pk, norm_nome(nome_cliente) nk,
           lower(btrim(email)) email, telefone, nome_cliente nome, estado, cidade, imported_at ts
    FROM rd_vendas
    UNION ALL
    SELECT norm_email(email), norm_phone(telefone), norm_nome(nome),
           lower(btrim(email)), telefone, nome, estado, cidade, imported_at
    FROM rd_leads
    UNION ALL
    SELECT norm_email(email), norm_phone(telefone), norm_nome(nome),
           lower(btrim(email)), telefone, nome, NULL, NULL, imported_at
    FROM planilha_leads
  ),
  agg AS (
    SELECT
      ek, pk, nk,
      (array_agg(email     ORDER BY ts DESC) FILTER (WHERE email     IS NOT NULL))[1] email,
      (array_agg(telefone  ORDER BY ts DESC) FILTER (WHERE telefone  IS NOT NULL))[1] telefone,
      (array_agg(nome      ORDER BY ts DESC) FILTER (WHERE nome      IS NOT NULL))[1] nome,
      (array_agg(estado    ORDER BY ts DESC) FILTER (WHERE estado    IS NOT NULL))[1] estado,
      (array_agg(cidade    ORDER BY ts DESC) FILTER (WHERE cidade    IS NOT NULL))[1] cidade,
      min(ts) first_seen, max(ts) last_seen
    FROM src
    WHERE ek IS NOT NULL OR pk IS NOT NULL OR nk IS NOT NULL
    GROUP BY ek, pk, nk
  )
  INSERT INTO dim_pessoa (email_key, phone_key, nome_key, email, telefone, nome, estado, cidade, first_seen_at, last_seen_at)
  SELECT ek, pk, nk, email, telefone, nome, estado, cidade, coalesce(first_seen, now()), coalesce(last_seen, now())
  FROM agg;
  GET DIAGNOSTICS v_pessoas = ROW_COUNT;

  -- ----- 4.2 fct_venda
  INSERT INTO fct_venda (
    pessoa_id, source, source_id, id_venda, email, telefone, nome,
    email_key, phone_key, nome_key, estado, cidade,
    turma, pacote, fase, proprietario, canal_venda, curso,
    valor, valor_moeda, valor_convertido, qtd_pagantes, qtd_parcelas,
    data_criacao, data_aprovacao, data_matricula,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    origem_lead, ultima_origem_lead, raw
  )
  SELECT
    p.pessoa_id, 'rd_vendas', v.id_venda, v.id_venda, v.email, v.telefone, v.nome_cliente,
    norm_email(v.email), norm_phone(v.telefone), norm_nome(v.nome_cliente), v.estado, v.cidade,
    v.turma, v.pacote, v.fase, v.proprietario, v.canal_venda, v.curso,
    v.valor, v.valor_moeda, v.valor_convertido, v.qtd_pagantes, v.qtd_parcelas,
    v.data_criacao, v.data_aprovacao,
    coalesce(v.data_matricula::date, v.data_aprovacao::date, v.data_criacao::date),
    v.utm_source, v.utm_medium, v.utm_campaign, v.utm_content, v.utm_term,
    v.origem_lead, v.ultima_origem_lead, v.raw
  FROM rd_vendas v
  LEFT JOIN dim_pessoa p
    ON (p.email_key IS NOT DISTINCT FROM norm_email(v.email))
   AND (p.phone_key IS NOT DISTINCT FROM norm_phone(v.telefone))
   AND (p.nome_key  IS NOT DISTINCT FROM norm_nome(v.nome_cliente));
  GET DIAGNOSTICS v_vendas = ROW_COUNT;

  -- ----- 4.3 fct_lead (rd_leads + planilha_leads)
  INSERT INTO fct_lead (
    pessoa_id, source, source_id, email, telefone, nome,
    email_key, phone_key, nome_key, estado, cidade,
    origem_lead, canal, status_lead,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    data_lead, raw
  )
  SELECT
    p.pessoa_id, 'rd_leads', l.id_lead_rd, l.email, l.telefone, l.nome,
    norm_email(l.email), norm_phone(l.telefone), norm_nome(l.nome), l.estado, l.cidade,
    l.origem_lead, l.canal, l.status_lead,
    l.utm_origem, l.utm_midia, l.utm_campanha, l.utm_conteudo, l.utm_termo,
    l.data_criacao, l.raw
  FROM rd_leads l
  LEFT JOIN dim_pessoa p
    ON (p.email_key IS NOT DISTINCT FROM norm_email(l.email))
   AND (p.phone_key IS NOT DISTINCT FROM norm_phone(l.telefone))
   AND (p.nome_key  IS NOT DISTINCT FROM norm_nome(l.nome));

  INSERT INTO fct_lead (
    pessoa_id, source, source_id, email, telefone, nome,
    email_key, phone_key, nome_key,
    origem_lead, canal,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    data_lead, raw
  )
  SELECT
    p.pessoa_id, 'planilha_leads', pl.id::text, pl.email, pl.telefone, pl.nome,
    norm_email(pl.email), norm_phone(pl.telefone), norm_nome(pl.nome),
    pl.origem_lead, pl.canal,
    pl.utm_source, pl.utm_medium, pl.utm_campaign, pl.utm_content, pl.utm_term,
    pl.data_lead::timestamptz, pl.raw
  FROM planilha_leads pl
  LEFT JOIN dim_pessoa p
    ON (p.email_key IS NOT DISTINCT FROM norm_email(pl.email))
   AND (p.phone_key IS NOT DISTINCT FROM norm_phone(pl.telefone))
   AND (p.nome_key  IS NOT DISTINCT FROM norm_nome(pl.nome));
  GET DIAGNOSTICS v_leads = ROW_COUNT;

  -- ----- 4.4 bridge_lead_venda (matching determinístico em camadas)
  -- camada 1: email
  INSERT INTO bridge_lead_venda (venda_id, lead_id, match_method, match_score, match_lag_days, is_pre_sale)
  SELECT v.venda_id, l.lead_id, 'email', 1.0,
         (v.data_matricula - l.data_lead::date)::int,
         (l.data_lead IS NULL OR l.data_lead::date <= v.data_matricula + INTERVAL '1 day')
  FROM fct_venda v
  JOIN fct_lead l ON l.email_key = v.email_key
  WHERE v.email_key IS NOT NULL
  ON CONFLICT DO NOTHING;

  -- camada 2: telefone (apenas vendas sem match por email)
  INSERT INTO bridge_lead_venda (venda_id, lead_id, match_method, match_score, match_lag_days, is_pre_sale)
  SELECT v.venda_id, l.lead_id, 'telefone', 0.9,
         (v.data_matricula - l.data_lead::date)::int,
         (l.data_lead IS NULL OR l.data_lead::date <= v.data_matricula + INTERVAL '1 day')
  FROM fct_venda v
  JOIN fct_lead l ON l.phone_key = v.phone_key
  WHERE v.phone_key IS NOT NULL
    AND is_valid_phone(v.telefone)
    AND NOT EXISTS (SELECT 1 FROM bridge_lead_venda b WHERE b.venda_id = v.venda_id)
  ON CONFLICT DO NOTHING;

  -- camada 3: nome+cidade (apenas se nome com 2+ tokens e venda ainda sem match)
  INSERT INTO bridge_lead_venda (venda_id, lead_id, match_method, match_score, match_lag_days, is_pre_sale)
  SELECT v.venda_id, l.lead_id, 'nome+cidade', 0.75,
         (v.data_matricula - l.data_lead::date)::int,
         (l.data_lead IS NULL OR l.data_lead::date <= v.data_matricula + INTERVAL '1 day')
  FROM fct_venda v
  JOIN fct_lead l ON l.nome_key = v.nome_key AND lower(coalesce(l.cidade,'')) = lower(coalesce(v.cidade,''))
  WHERE v.nome_key IS NOT NULL AND array_length(string_to_array(v.nome_key,' '),1) >= 2
    AND coalesce(v.cidade,'') <> ''
    AND NOT EXISTS (SELECT 1 FROM bridge_lead_venda b WHERE b.venda_id = v.venda_id)
  ON CONFLICT DO NOTHING;

  -- camada 4: nome+estado (fallback fraco)
  INSERT INTO bridge_lead_venda (venda_id, lead_id, match_method, match_score, match_lag_days, is_pre_sale)
  SELECT v.venda_id, l.lead_id, 'nome+estado', 0.6,
         (v.data_matricula - l.data_lead::date)::int,
         (l.data_lead IS NULL OR l.data_lead::date <= v.data_matricula + INTERVAL '1 day')
  FROM fct_venda v
  JOIN fct_lead l ON l.nome_key = v.nome_key AND lower(coalesce(l.estado,'')) = lower(coalesce(v.estado,''))
  WHERE v.nome_key IS NOT NULL AND array_length(string_to_array(v.nome_key,' '),1) >= 2
    AND coalesce(v.estado,'') <> ''
    AND NOT EXISTS (SELECT 1 FROM bridge_lead_venda b WHERE b.venda_id = v.venda_id)
  ON CONFLICT DO NOTHING;

  -- marca o melhor match por venda como primary (prefere is_pre_sale, score, lag mais próximo)
  WITH ranked AS (
    SELECT id, venda_id,
           row_number() OVER (
             PARTITION BY venda_id
             ORDER BY is_pre_sale DESC,
                      match_score DESC,
                      abs(coalesce(match_lag_days, 999999)) ASC
           ) rn
    FROM bridge_lead_venda
  )
  UPDATE bridge_lead_venda b SET is_primary = true
  FROM ranked r
  WHERE b.id = r.id AND r.rn = 1;

  GET DIAGNOSTICS v_bridges = ROW_COUNT;

  -- ----- 4.5 DQ findings
  -- emails inválidos
  INSERT INTO dq_findings (entity, entity_id, rule, severity, details, batch_id)
  SELECT 'venda', venda_id::text, 'email_invalido', 'warn',
         jsonb_build_object('email', email), v_batch
  FROM fct_venda WHERE email IS NOT NULL AND NOT is_valid_email(email);

  -- telefones inválidos
  INSERT INTO dq_findings (entity, entity_id, rule, severity, details, batch_id)
  SELECT 'venda', venda_id::text, 'telefone_invalido', 'info',
         jsonb_build_object('telefone', telefone), v_batch
  FROM fct_venda WHERE telefone IS NOT NULL AND NOT is_valid_phone(telefone);

  -- duplicidade suspeita: mesmo nome+valor+data±3d com ids diferentes
  INSERT INTO dq_findings (entity, entity_id, rule, severity, details, batch_id)
  SELECT 'venda', a.venda_id::text, 'duplicidade_suspeita', 'warn',
         jsonb_build_object('outro_id', b.venda_id, 'nome', a.nome, 'valor', a.valor_convertido, 'data', a.data_matricula), v_batch
  FROM fct_venda a
  JOIN fct_venda b
    ON a.venda_id < b.venda_id
   AND a.nome_key = b.nome_key
   AND a.valor_convertido = b.valor_convertido
   AND abs(a.data_matricula - b.data_matricula) <= 3
  WHERE a.nome_key IS NOT NULL AND a.valor_convertido > 0;

  -- data_matricula fora de range
  INSERT INTO dq_findings (entity, entity_id, rule, severity, details, batch_id)
  SELECT 'venda', venda_id::text, 'data_matricula_suspeita', 'error',
         jsonb_build_object('data', data_matricula), v_batch
  FROM fct_venda WHERE data_matricula > current_date + INTERVAL '90 days' OR data_matricula < '2020-01-01';

  -- valor zero ou negativo
  INSERT INTO dq_findings (entity, entity_id, rule, severity, details, batch_id)
  SELECT 'venda', venda_id::text, 'valor_invalido', 'warn',
         jsonb_build_object('valor_convertido', valor_convertido), v_batch
  FROM fct_venda WHERE coalesce(valor_convertido,0) <= 0;

  -- venda sem nenhum identificador (email e telefone vazios)
  INSERT INTO dq_findings (entity, entity_id, rule, severity, details, batch_id)
  SELECT 'venda', venda_id::text, 'sem_identificador', 'warn',
         jsonb_build_object('id_venda', id_venda), v_batch
  FROM fct_venda WHERE email_key IS NULL AND phone_key IS NULL;

  -- lead com data depois da venda casada (atribuição inválida)
  INSERT INTO dq_findings (entity, entity_id, rule, severity, details, batch_id)
  SELECT 'bridge', b.id::text, 'lead_posterior_a_venda', 'info',
         jsonb_build_object('lag_days', b.match_lag_days, 'method', b.match_method), v_batch
  FROM bridge_lead_venda b
  WHERE b.is_pre_sale = false;

  GET DIAGNOSTICS v_dq = ROW_COUNT;

  -- registra rebuild
  INSERT INTO meta_pipeline (k, v, updated_at)
  VALUES ('last_rebuild',
          jsonb_build_object('batch_id', v_batch, 'pessoas', v_pessoas, 'vendas', v_vendas, 'leads', v_leads, 'bridges', v_bridges),
          now())
  ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v, updated_at = now();

  RETURN jsonb_build_object(
    'batch_id', v_batch,
    'pessoas', v_pessoas,
    'vendas', v_vendas,
    'leads', v_leads,
    'bridges', v_bridges,
    'dq_findings', v_dq,
    'as_of', now()
  );
END $$;

-- ============================================================
-- 5. View vendas_atribuidas reescrita sobre o core
-- ============================================================
DROP VIEW IF EXISTS public.vendas_atribuidas;
CREATE VIEW public.vendas_atribuidas
WITH (security_invoker=on)
AS
SELECT
  v.venda_id::text AS id,
  v.id_venda,
  v.email,
  v.nome,
  v.turma,
  v.pacote,
  v.fase,
  v.proprietario,
  v.canal_venda,
  v.data_criacao AS data_venda,
  v.data_aprovacao,
  v.data_matricula,
  v.valor,
  v.valor_convertido,
  v.qtd_pagantes,
  v.qtd_parcelas,
  v.estado,
  v.cidade,
  COALESCE(NULLIF(v.utm_source,''), l.utm_source) AS utm_origem,
  COALESCE(NULLIF(v.utm_medium,''), l.utm_medium) AS utm_midia,
  COALESCE(NULLIF(v.utm_campaign,''), l.utm_campaign) AS utm_campanha,
  COALESCE(NULLIF(v.utm_content,''), l.utm_content) AS utm_conteudo,
  COALESCE(NULLIF(v.utm_term,''), l.utm_term) AS utm_termo,
  COALESCE(l.canal, 'Sem Atribuição') AS canal,
  v.origem_lead,
  v.ultima_origem_lead,
  l.lead_id::text AS lead_id,
  l.data_lead AS lead_data_criacao,
  COALESCE(b.match_method, 'sem') AS tipo_match,
  COALESCE(b.match_score, 0) AS match_score,
  b.match_lag_days,
  CASE
    WHEN b.lead_id IS NOT NULL AND b.is_pre_sale THEN 'Lead Anterior'
    WHEN b.lead_id IS NOT NULL THEN 'Lead Posterior'
    WHEN v.utm_source IS NOT NULL AND v.utm_source <> '' THEN 'UTM Direta'
    ELSE 'Sem Atribuição'
  END AS tipo_atribuicao,
  v.created_at
FROM fct_venda v
LEFT JOIN bridge_lead_venda b ON b.venda_id = v.venda_id AND b.is_primary
LEFT JOIN fct_lead l ON l.lead_id = b.lead_id;

GRANT SELECT ON public.vendas_atribuidas TO authenticated;

-- ============================================================
-- 6. Compatibilidade com get_vendas_agg (atualiza tipo_atribuicao novo)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_vendas_agg(
  p_date_from text DEFAULT NULL, p_date_to text DEFAULT NULL,
  p_turmas text[] DEFAULT NULL, p_estados text[] DEFAULT NULL,
  p_canais text[] DEFAULT NULL, p_search text DEFAULT NULL, p_tipo text DEFAULT NULL)
RETURNS TABLE(total_count bigint, receita_sum numeric, com_lead_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*)::BIGINT,
         COALESCE(SUM(valor_convertido),0),
         COUNT(*) FILTER (WHERE tipo_atribuicao IN ('Lead Anterior','Lead Posterior','UTM Direta'))::BIGINT
  FROM public.vendas_atribuidas
  WHERE (p_date_from IS NULL OR p_date_from='' OR data_matricula >= p_date_from::date)
    AND (p_date_to   IS NULL OR p_date_to=''   OR data_matricula <= p_date_to::date)
    AND (p_turmas  IS NULL OR cardinality(p_turmas)=0  OR turma=ANY(p_turmas))
    AND (p_estados IS NULL OR cardinality(p_estados)=0 OR estado=ANY(p_estados))
    AND (p_canais  IS NULL OR cardinality(p_canais)=0  OR canal=ANY(p_canais))
    AND (p_search  IS NULL OR p_search='' OR nome ILIKE '%'||p_search||'%' OR email ILIKE '%'||p_search||'%')
    AND (p_tipo IS NULL OR p_tipo='' OR p_tipo='Todas'
         OR (p_tipo='Com Lead' AND tipo_atribuicao IN ('Lead Anterior','Lead Posterior'))
         OR (p_tipo='Sem Atribuicao' AND tipo_atribuicao='Sem Atribuição'));
END; $$;
