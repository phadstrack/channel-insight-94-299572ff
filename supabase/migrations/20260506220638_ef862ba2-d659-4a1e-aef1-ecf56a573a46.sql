
-- Nova taxonomia de canal: Mídia, CRM, YouTube, Redes, Orgânicos, Outros, Sem Atribuição
CREATE OR REPLACE FUNCTION public.derive_canal(
  p_utm_source text,
  p_utm_medium text,
  p_origem text,
  p_ultima_origem text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  s text := lower(coalesce(p_utm_source,''));
  m text := lower(coalesce(p_utm_medium,''));
  o text := lower(coalesce(p_origem,''));
  u text := lower(coalesce(p_ultima_origem,''));
  hay text;
BEGIN
  hay := s || ' ' || m || ' ' || o || ' ' || u;

  -- 1. YouTube (prioridade alta — termo único e claro)
  IF hay ~ '(youtube|\[yt\]|\byt\b|y_tube)' THEN
    RETURN 'YouTube';
  END IF;

  -- 2. CRM (email/whatsapp/sz chat/rdstation/mailchimp)
  IF hay ~ '(email|e-mail|mailchimp|rdstation|rd_email|whats|wpp|whatsapp|sz chat|sz_chat|szchat|crm)' THEN
    RETURN 'CRM';
  END IF;

  -- 3. Redes sociais / Social Seller
  IF hay ~ '(social seller|social_seller|\bss\b|ss mcis|ss_mcis|stand cis|indica|referral|referência|aluno cis)' THEN
    RETURN 'Redes';
  END IF;

  -- 4. Orgânicos
  IF m ~ '(organic|organico|orgânico|seo)' OR s ~ '(organic|organico|seo|site)' OR hay ~ '(\[org\]|\borg\b|orgânico|organico)' THEN
    RETURN 'Orgânicos';
  END IF;

  -- 5. Mídia (tráfego pago: ads, cpc, paid, gads, fb, meta, google, tiktok, lp, vsl)
  IF m ~ '(ads|cpc|paid|trafego|tráfego|cpm|display|video)'
     OR s ~ '(meta|facebook|instagram|\bfb\b|\big\b|google|gads|adwords|tiktok|bing|linkedin|twitter|\bx\b|ads_|mkt_|google_search)'
     OR hay ~ '(\[fb\]|\[go\]|\[cm\]|tráfego|trafego|form - meta|meta lead ads|google_search|ads_gg|ads_fb|ads_meta|\[lp\]|\[vsl\]|\[pgven\]|\[ck\])' THEN
    RETURN 'Mídia';
  END IF;

  -- 6. Outros com lead
  IF length(o) > 0 OR length(u) > 0 OR length(s) > 0 THEN
    RETURN 'Outros';
  END IF;

  RETURN 'Sem Atribuição';
END;
$$;

-- Atualizar view vendas_atribuidas: recalcula canal pela nova taxonomia
CREATE OR REPLACE VIEW public.vendas_atribuidas AS
SELECT v.venda_id::text AS id,
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
    COALESCE(NULLIF(v.utm_source, ''::text), l.utm_source) AS utm_origem,
    COALESCE(NULLIF(v.utm_medium, ''::text), l.utm_medium) AS utm_midia,
    COALESCE(NULLIF(v.utm_campaign, ''::text), l.utm_campaign) AS utm_campanha,
    COALESCE(NULLIF(v.utm_content, ''::text), l.utm_content) AS utm_conteudo,
    COALESCE(NULLIF(v.utm_term, ''::text), l.utm_term) AS utm_termo,
    public.derive_canal(
      COALESCE(NULLIF(v.utm_source,''), l.utm_source),
      COALESCE(NULLIF(v.utm_medium,''), l.utm_medium),
      COALESCE(v.origem_lead, l.origem_lead),
      v.ultima_origem_lead
    ) AS canal,
    v.origem_lead,
    v.ultima_origem_lead,
    l.lead_id::text AS lead_id,
    l.data_lead AS lead_data_criacao,
    COALESCE(b.match_method, 'sem'::text) AS tipo_match,
    COALESCE(b.match_score, 0::numeric) AS match_score,
    b.match_lag_days,
    CASE
        WHEN b.lead_id IS NOT NULL AND b.is_pre_sale THEN 'Lead Anterior'::text
        WHEN b.lead_id IS NOT NULL THEN 'Lead Posterior'::text
        WHEN v.utm_source IS NOT NULL AND v.utm_source <> ''::text THEN 'UTM Direta'::text
        ELSE 'Sem Atribuição'::text
    END AS tipo_atribuicao,
    v.created_at
   FROM fct_venda v
     LEFT JOIN bridge_lead_venda b ON b.venda_id = v.venda_id AND b.is_primary
     LEFT JOIN fct_lead l ON l.lead_id = b.lead_id;

-- Atualizar canal em fct_lead para os mesmos buckets
UPDATE public.fct_lead
SET canal = public.derive_canal(utm_source, utm_medium, origem_lead, NULL);
