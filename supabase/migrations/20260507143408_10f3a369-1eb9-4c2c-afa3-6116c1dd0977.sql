
CREATE OR REPLACE FUNCTION public.derive_canal_v2(p_ultima_origem text, p_origem text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE fonte text; f text;
BEGIN
  fonte := COALESCE(NULLIF(btrim(p_ultima_origem),''), NULLIF(btrim(p_origem),''));
  IF fonte IS NULL THEN RETURN 'Sem Atribuição'; END IF;
  f := lower(fonte);
  IF f ~ '(youtube|\[yt\]|\byt\b|iex app)' THEN RETURN 'YouTube'; END IF;
  IF f ~ '(email|e-mail|mailchimp|rdstation|whats|wpp|whatsapp|sz chat|sz_chat|disparo marketing|hotmart|emkt|email mkt)' THEN RETURN 'CRM'; END IF;
  IF f ~ '(social seller|\bss\b|ss mcis|ss pv|ss cv|indica|indicação|aluno cis|ex-aluno|ex aluno|stand cis|ativação comercial|avalon - social|cliente base)' THEN RETURN 'Redes'; END IF;
  IF f ~ '(\[fb\]|\[go\]|\[cm\]|\[ck\]|\[lp\]|\[vsl\]|\[pgven\]|form - meta|meta lead ads|tráfego|trafego|lead tra|\bads\b|typeform|^lp |lp -|masterclass|meteorico|meteórico|mulheres experience|ia mcis|ia avalon|black november|black friday|pre-venda|live pv|fbcis)' THEN RETURN 'Mídia'; END IF;
  IF f ~ '(\[org\]|orgânico|organico|organic|\bseo\b|\bsite\b)' THEN RETURN 'Orgânicos'; END IF;
  IF f ~ '(pedido|cortesia|bonux|bônus|bonus|transferido|checkout|base dksoft|lista de espera)' THEN RETURN 'Operacional'; END IF;
  RETURN 'Outros';
END $$;

DROP VIEW IF EXISTS public.vendas_atribuidas CASCADE;
CREATE VIEW public.vendas_atribuidas AS
SELECT
  v.venda_id::text AS id,
  v.id_venda, v.email, v.nome, v.turma, v.pacote, v.fase, v.proprietario, v.canal_venda,
  v.data_criacao AS data_venda, v.data_aprovacao, v.data_matricula,
  v.valor, v.valor_convertido, v.qtd_pagantes, v.qtd_parcelas, v.estado, v.cidade,
  v.utm_source AS utm_origem, v.utm_medium AS utm_midia, v.utm_campaign AS utm_campanha,
  v.utm_content AS utm_conteudo, v.utm_term AS utm_termo,
  l.utm_source AS lead_utm_source, l.utm_medium AS lead_utm_medium,
  l.utm_campaign AS lead_utm_campaign, l.utm_content AS lead_utm_content,
  v.origem_lead, v.ultima_origem_lead,
  COALESCE(NULLIF(btrim(v.ultima_origem_lead),''), NULLIF(btrim(v.origem_lead),'')) AS origem_principal,
  CASE WHEN NULLIF(btrim(v.ultima_origem_lead),'') IS NOT NULL THEN NULLIF(btrim(v.origem_lead),'') END AS origem_secundaria,
  CASE
    WHEN NULLIF(btrim(v.ultima_origem_lead),'') IS NOT NULL THEN 'ultima_origem'
    WHEN NULLIF(btrim(v.origem_lead),'') IS NOT NULL THEN 'origem'
    ELSE 'sem_origem'
  END AS fonte_atribuicao,
  derive_canal_v2(v.ultima_origem_lead, v.origem_lead) AS canal,
  l.lead_id::text AS lead_id, l.data_lead AS lead_data_criacao,
  COALESCE(b.match_method,'sem') AS tipo_match,
  COALESCE(b.match_score, 0::numeric) AS match_score, b.match_lag_days,
  CASE
    WHEN b.lead_id IS NOT NULL AND b.is_pre_sale THEN 'Lead Anterior'
    WHEN b.lead_id IS NOT NULL THEN 'Lead Posterior'
    WHEN COALESCE(NULLIF(btrim(v.ultima_origem_lead),''), NULLIF(btrim(v.origem_lead),'')) IS NOT NULL THEN 'Origem Direta'
    ELSE 'Sem Atribuição'
  END AS tipo_atribuicao,
  v.created_at
FROM fct_venda v
LEFT JOIN bridge_lead_venda b ON b.venda_id = v.venda_id AND b.is_primary
LEFT JOIN fct_lead l ON l.lead_id = b.lead_id;

CREATE OR REPLACE FUNCTION public.exec_read_sql(p_sql text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s text; s_low text; result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  s := regexp_replace(btrim(p_sql), ';\s*$', '');
  s_low := lower(s);
  IF position(';' IN s) > 0 THEN RAISE EXCEPTION 'Apenas uma instrução por execução'; END IF;
  IF s_low !~ '^(select|with)\s' THEN RAISE EXCEPTION 'Apenas SELECT/WITH são permitidas'; END IF;
  IF s_low ~ '\m(insert|update|delete|drop|alter|truncate|grant|revoke|create|comment|copy|vacuum|analyze|call|do|set|reset)\M' THEN
    RAISE EXCEPTION 'Comando não permitido';
  END IF;
  IF s_low ~ '(auth\.|pg_|information_schema|user_roles|profiles|secrets)' THEN
    RAISE EXCEPTION 'Tabela/schema restrito';
  END IF;
  EXECUTE format('SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (%s LIMIT 5000) t', s) INTO result;
  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.exec_read_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_read_sql(text) TO authenticated;
