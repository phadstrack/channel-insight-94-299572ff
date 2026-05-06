
CREATE OR REPLACE FUNCTION public.rebuild_core()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_batch uuid := gen_random_uuid();
  v_pessoas int; v_vendas int; v_leads int; v_bridges int; v_dq int;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(),'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  TRUNCATE public.bridge_lead_venda RESTART IDENTITY;
  TRUNCATE public.fct_venda CASCADE;
  TRUNCATE public.fct_lead CASCADE;
  TRUNCATE public.dim_pessoa CASCADE;
  DELETE FROM public.dq_findings;

  WITH src AS (
    SELECT norm_email(email) ek, norm_phone(telefone) pk, norm_nome(nome_cliente) nk,
           lower(btrim(email)) email, telefone, nome_cliente nome, estado, cidade, imported_at ts
    FROM rd_vendas
    UNION ALL
    SELECT norm_email(email), norm_phone(telefone), norm_nome(nome),
           lower(btrim(email)), telefone, nome, estado, cidade, imported_at FROM rd_leads
    UNION ALL
    SELECT norm_email(email), norm_phone(telefone), norm_nome(nome),
           lower(btrim(email)), telefone, nome, NULL, NULL, imported_at FROM planilha_leads
  ),
  keyed AS (
    SELECT *,
      CASE WHEN ek IS NOT NULL THEN 'e:'||ek
           WHEN pk IS NOT NULL THEN 'p:'||pk
           WHEN nk IS NOT NULL THEN 'n:'||nk END AS pkey
    FROM src
    WHERE ek IS NOT NULL OR pk IS NOT NULL OR nk IS NOT NULL
  ),
  agg AS (
    SELECT pkey,
      (array_agg(ek ORDER BY ts DESC) FILTER (WHERE ek IS NOT NULL))[1] ek,
      (array_agg(pk ORDER BY ts DESC) FILTER (WHERE pk IS NOT NULL))[1] pk,
      (array_agg(nk ORDER BY ts DESC) FILTER (WHERE nk IS NOT NULL))[1] nk,
      (array_agg(email    ORDER BY ts DESC) FILTER (WHERE email    IS NOT NULL))[1] email,
      (array_agg(telefone ORDER BY ts DESC) FILTER (WHERE telefone IS NOT NULL))[1] telefone,
      (array_agg(nome     ORDER BY ts DESC) FILTER (WHERE nome     IS NOT NULL))[1] nome,
      (array_agg(estado   ORDER BY ts DESC) FILTER (WHERE estado   IS NOT NULL))[1] estado,
      (array_agg(cidade   ORDER BY ts DESC) FILTER (WHERE cidade   IS NOT NULL))[1] cidade,
      min(ts) first_seen, max(ts) last_seen
    FROM keyed GROUP BY pkey
  )
  INSERT INTO dim_pessoa (email_key, phone_key, nome_key, email, telefone, nome, estado, cidade, first_seen_at, last_seen_at)
  SELECT ek, pk, nk, email, telefone, nome, estado, cidade, coalesce(first_seen, now()), coalesce(last_seen, now())
  FROM agg;
  GET DIAGNOSTICS v_pessoas = ROW_COUNT;

  INSERT INTO fct_venda (pessoa_id, source, source_id, id_venda, email, telefone, nome,
    email_key, phone_key, nome_key, estado, cidade, turma, pacote, fase, proprietario, canal_venda, curso,
    valor, valor_moeda, valor_convertido, qtd_pagantes, qtd_parcelas,
    data_criacao, data_aprovacao, data_matricula,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    origem_lead, ultima_origem_lead, raw)
  SELECT
    (SELECT pessoa_id FROM dim_pessoa p
       WHERE (norm_email(v.email) IS NOT NULL AND p.email_key = norm_email(v.email))
          OR (norm_email(v.email) IS NULL AND norm_phone(v.telefone) IS NOT NULL AND p.phone_key = norm_phone(v.telefone))
          OR (norm_email(v.email) IS NULL AND norm_phone(v.telefone) IS NULL AND p.nome_key = norm_nome(v.nome_cliente))
       LIMIT 1),
    'rd_vendas', v.id_venda, v.id_venda, v.email, v.telefone, v.nome_cliente,
    norm_email(v.email), norm_phone(v.telefone), norm_nome(v.nome_cliente), v.estado, v.cidade,
    v.turma, v.pacote, v.fase, v.proprietario, v.canal_venda, v.curso,
    v.valor, v.valor_moeda, v.valor_convertido, v.qtd_pagantes, v.qtd_parcelas,
    v.data_criacao, v.data_aprovacao,
    coalesce(v.data_matricula::date, v.data_aprovacao::date, v.data_criacao::date),
    v.utm_source, v.utm_medium, v.utm_campaign, v.utm_content, v.utm_term,
    v.origem_lead, v.ultima_origem_lead, v.raw
  FROM rd_vendas v;
  GET DIAGNOSTICS v_vendas = ROW_COUNT;

  INSERT INTO fct_lead (pessoa_id, source, source_id, email, telefone, nome,
    email_key, phone_key, nome_key, estado, cidade, origem_lead, canal, status_lead,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, data_lead, raw)
  SELECT
    (SELECT pessoa_id FROM dim_pessoa p
       WHERE (norm_email(l.email) IS NOT NULL AND p.email_key = norm_email(l.email))
          OR (norm_email(l.email) IS NULL AND norm_phone(l.telefone) IS NOT NULL AND p.phone_key = norm_phone(l.telefone))
          OR (norm_email(l.email) IS NULL AND norm_phone(l.telefone) IS NULL AND p.nome_key = norm_nome(l.nome))
       LIMIT 1),
    'rd_leads', l.id_lead_rd, l.email, l.telefone, l.nome,
    norm_email(l.email), norm_phone(l.telefone), norm_nome(l.nome), l.estado, l.cidade,
    l.origem_lead, l.canal, l.status_lead,
    l.utm_origem, l.utm_midia, l.utm_campanha, l.utm_conteudo, l.utm_termo, l.data_criacao, l.raw
  FROM rd_leads l;

  INSERT INTO fct_lead (pessoa_id, source, source_id, email, telefone, nome,
    email_key, phone_key, nome_key, origem_lead, canal,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, data_lead, raw)
  SELECT
    (SELECT pessoa_id FROM dim_pessoa p
       WHERE (norm_email(pl.email) IS NOT NULL AND p.email_key = norm_email(pl.email))
          OR (norm_email(pl.email) IS NULL AND norm_phone(pl.telefone) IS NOT NULL AND p.phone_key = norm_phone(pl.telefone))
          OR (norm_email(pl.email) IS NULL AND norm_phone(pl.telefone) IS NULL AND p.nome_key = norm_nome(pl.nome))
       LIMIT 1),
    'planilha_leads', pl.id::text, pl.email, pl.telefone, pl.nome,
    norm_email(pl.email), norm_phone(pl.telefone), norm_nome(pl.nome),
    pl.origem_lead, pl.canal,
    pl.utm_source, pl.utm_medium, pl.utm_campaign, pl.utm_content, pl.utm_term,
    pl.data_lead::timestamptz, pl.raw
  FROM planilha_leads pl;
  GET DIAGNOSTICS v_leads = ROW_COUNT;

  -- Matching em camadas
  INSERT INTO bridge_lead_venda (venda_id, lead_id, match_method, match_score, match_lag_days, is_pre_sale)
  SELECT v.venda_id, l.lead_id, 'email', 1.0,
         (v.data_matricula - l.data_lead::date)::int,
         (l.data_lead IS NULL OR l.data_lead::date <= v.data_matricula + INTERVAL '1 day')
  FROM fct_venda v JOIN fct_lead l ON l.email_key = v.email_key
  WHERE v.email_key IS NOT NULL ON CONFLICT DO NOTHING;

  INSERT INTO bridge_lead_venda (venda_id, lead_id, match_method, match_score, match_lag_days, is_pre_sale)
  SELECT v.venda_id, l.lead_id, 'telefone', 0.9,
         (v.data_matricula - l.data_lead::date)::int,
         (l.data_lead IS NULL OR l.data_lead::date <= v.data_matricula + INTERVAL '1 day')
  FROM fct_venda v JOIN fct_lead l ON l.phone_key = v.phone_key
  WHERE v.phone_key IS NOT NULL AND is_valid_phone(v.telefone)
    AND NOT EXISTS (SELECT 1 FROM bridge_lead_venda b WHERE b.venda_id = v.venda_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO bridge_lead_venda (venda_id, lead_id, match_method, match_score, match_lag_days, is_pre_sale)
  SELECT v.venda_id, l.lead_id, 'nome+cidade', 0.75,
         (v.data_matricula - l.data_lead::date)::int,
         (l.data_lead IS NULL OR l.data_lead::date <= v.data_matricula + INTERVAL '1 day')
  FROM fct_venda v JOIN fct_lead l ON l.nome_key = v.nome_key AND lower(coalesce(l.cidade,'')) = lower(coalesce(v.cidade,''))
  WHERE v.nome_key IS NOT NULL AND array_length(string_to_array(v.nome_key,' '),1) >= 2
    AND coalesce(v.cidade,'') <> ''
    AND NOT EXISTS (SELECT 1 FROM bridge_lead_venda b WHERE b.venda_id = v.venda_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO bridge_lead_venda (venda_id, lead_id, match_method, match_score, match_lag_days, is_pre_sale)
  SELECT v.venda_id, l.lead_id, 'nome+estado', 0.6,
         (v.data_matricula - l.data_lead::date)::int,
         (l.data_lead IS NULL OR l.data_lead::date <= v.data_matricula + INTERVAL '1 day')
  FROM fct_venda v JOIN fct_lead l ON l.nome_key = v.nome_key AND lower(coalesce(l.estado,'')) = lower(coalesce(v.estado,''))
  WHERE v.nome_key IS NOT NULL AND array_length(string_to_array(v.nome_key,' '),1) >= 2
    AND coalesce(v.estado,'') <> ''
    AND NOT EXISTS (SELECT 1 FROM bridge_lead_venda b WHERE b.venda_id = v.venda_id)
  ON CONFLICT DO NOTHING;

  WITH ranked AS (
    SELECT id, venda_id,
           row_number() OVER (PARTITION BY venda_id
             ORDER BY is_pre_sale DESC, match_score DESC, abs(coalesce(match_lag_days, 999999)) ASC) rn
    FROM bridge_lead_venda)
  UPDATE bridge_lead_venda b SET is_primary = true FROM ranked r WHERE b.id = r.id AND r.rn = 1;
  GET DIAGNOSTICS v_bridges = ROW_COUNT;

  -- DQ
  INSERT INTO dq_findings (entity, entity_id, rule, severity, details, batch_id)
  SELECT 'venda', venda_id::text, 'email_invalido', 'warn', jsonb_build_object('email', email), v_batch
  FROM fct_venda WHERE email IS NOT NULL AND NOT is_valid_email(email);

  INSERT INTO dq_findings (entity, entity_id, rule, severity, details, batch_id)
  SELECT 'venda', venda_id::text, 'telefone_invalido', 'info', jsonb_build_object('telefone', telefone), v_batch
  FROM fct_venda WHERE telefone IS NOT NULL AND NOT is_valid_phone(telefone);

  INSERT INTO dq_findings (entity, entity_id, rule, severity, details, batch_id)
  SELECT 'venda', a.venda_id::text, 'duplicidade_suspeita', 'warn',
         jsonb_build_object('outro_id', b.venda_id, 'nome', a.nome, 'valor', a.valor_convertido, 'data', a.data_matricula), v_batch
  FROM fct_venda a JOIN fct_venda b
    ON a.venda_id < b.venda_id AND a.nome_key = b.nome_key
   AND a.valor_convertido = b.valor_convertido AND abs(a.data_matricula - b.data_matricula) <= 3
  WHERE a.nome_key IS NOT NULL AND a.valor_convertido > 0;

  INSERT INTO dq_findings (entity, entity_id, rule, severity, details, batch_id)
  SELECT 'venda', venda_id::text, 'data_matricula_suspeita', 'error', jsonb_build_object('data', data_matricula), v_batch
  FROM fct_venda WHERE data_matricula > current_date + INTERVAL '90 days' OR data_matricula < '2020-01-01';

  INSERT INTO dq_findings (entity, entity_id, rule, severity, details, batch_id)
  SELECT 'venda', venda_id::text, 'valor_invalido', 'warn', jsonb_build_object('valor_convertido', valor_convertido), v_batch
  FROM fct_venda WHERE coalesce(valor_convertido,0) <= 0;

  INSERT INTO dq_findings (entity, entity_id, rule, severity, details, batch_id)
  SELECT 'venda', venda_id::text, 'sem_identificador', 'warn', jsonb_build_object('id_venda', id_venda), v_batch
  FROM fct_venda WHERE email_key IS NULL AND phone_key IS NULL;

  INSERT INTO dq_findings (entity, entity_id, rule, severity, details, batch_id)
  SELECT 'bridge', b.id::text, 'lead_posterior_a_venda', 'info',
         jsonb_build_object('lag_days', b.match_lag_days, 'method', b.match_method), v_batch
  FROM bridge_lead_venda b WHERE b.is_pre_sale = false AND b.is_primary;
  GET DIAGNOSTICS v_dq = ROW_COUNT;

  INSERT INTO meta_pipeline (k, v, updated_at)
  VALUES ('last_rebuild',
          jsonb_build_object('batch_id', v_batch, 'pessoas', v_pessoas, 'vendas', v_vendas, 'leads', v_leads, 'bridges', v_bridges),
          now())
  ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v, updated_at = now();

  RETURN jsonb_build_object('batch_id', v_batch, 'pessoas', v_pessoas, 'vendas', v_vendas, 'leads', v_leads, 'bridges', v_bridges, 'dq_findings', v_dq, 'as_of', now());
END $$;

SELECT public.rebuild_core();
