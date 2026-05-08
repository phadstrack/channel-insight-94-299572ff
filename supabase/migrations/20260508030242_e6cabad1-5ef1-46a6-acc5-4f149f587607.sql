-- =====================================================================
-- query_builder: explorador visual sem SQL (whitelist + LATERAL joins)
-- =====================================================================

-- Whitelist de tabelas/colunas exposta para a UI
CREATE OR REPLACE FUNCTION public.query_builder_meta()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN jsonb_build_object(
    'tables', jsonb_build_array(
      jsonb_build_object('name','fct_venda','label','Vendas (fato)','keys',jsonb_build_array('email_key','phone_key','pessoa_id','venda_id'),
        'columns', (SELECT jsonb_agg(jsonb_build_object('name', column_name, 'type', data_type) ORDER BY ordinal_position)
                    FROM information_schema.columns WHERE table_schema='public' AND table_name='fct_venda')),
      jsonb_build_object('name','fct_lead','label','Leads (fato)','keys',jsonb_build_array('email_key','phone_key','pessoa_id','lead_id'),
        'columns', (SELECT jsonb_agg(jsonb_build_object('name', column_name, 'type', data_type) ORDER BY ordinal_position)
                    FROM information_schema.columns WHERE table_schema='public' AND table_name='fct_lead')),
      jsonb_build_object('name','bridge_lead_venda','label','Bridge Lead↔Venda','keys',jsonb_build_array('venda_id','lead_id'),
        'columns', (SELECT jsonb_agg(jsonb_build_object('name', column_name, 'type', data_type) ORDER BY ordinal_position)
                    FROM information_schema.columns WHERE table_schema='public' AND table_name='bridge_lead_venda')),
      jsonb_build_object('name','dim_pessoa','label','Pessoas (dim)','keys',jsonb_build_array('email_key','phone_key','pessoa_id'),
        'columns', (SELECT jsonb_agg(jsonb_build_object('name', column_name, 'type', data_type) ORDER BY ordinal_position)
                    FROM information_schema.columns WHERE table_schema='public' AND table_name='dim_pessoa')),
      jsonb_build_object('name','vendas_atribuidas','label','Vendas Atribuídas (view)','keys',jsonb_build_array('email_key','phone_key'),
        'columns', (SELECT jsonb_agg(jsonb_build_object('name', column_name, 'type', data_type) ORDER BY ordinal_position)
                    FROM information_schema.columns WHERE table_schema='public' AND table_name='vendas_atribuidas')),
      jsonb_build_object('name','rd_vendas','label','RD Vendas (raw)','keys',jsonb_build_array('email','telefone','id_venda'),
        'columns', (SELECT jsonb_agg(jsonb_build_object('name', column_name, 'type', data_type) ORDER BY ordinal_position)
                    FROM information_schema.columns WHERE table_schema='public' AND table_name='rd_vendas')),
      jsonb_build_object('name','rd_leads','label','RD Leads (raw)','keys',jsonb_build_array('email','telefone','id_lead_rd'),
        'columns', (SELECT jsonb_agg(jsonb_build_object('name', column_name, 'type', data_type) ORDER BY ordinal_position)
                    FROM information_schema.columns WHERE table_schema='public' AND table_name='rd_leads')),
      jsonb_build_object('name','planilha_vendas','label','Planilha Vendas','keys',jsonb_build_array('email','telefone'),
        'columns', (SELECT jsonb_agg(jsonb_build_object('name', column_name, 'type', data_type) ORDER BY ordinal_position)
                    FROM information_schema.columns WHERE table_schema='public' AND table_name='planilha_vendas')),
      jsonb_build_object('name','planilha_leads','label','Planilha Leads','keys',jsonb_build_array('email','telefone'),
        'columns', (SELECT jsonb_agg(jsonb_build_object('name', column_name, 'type', data_type) ORDER BY ordinal_position)
                    FROM information_schema.columns WHERE table_schema='public' AND table_name='planilha_leads'))
    ),
    'aggregations', jsonb_build_array('count','count_distinct','min','max','sum','avg','first','last','list_distinct'),
    'operators', jsonb_build_array('=','<>','>','>=','<','<=','in','not_in','between','is_null','is_not_null','ilike','contains')
  );
END $$;


-- ---------------------------------------------------------------------
-- Helper: valida se table/column pertencem ao whitelist
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._qb_assert_col(p_table text, p_col text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE allowed text[] := ARRAY[
  'fct_venda','fct_lead','bridge_lead_venda','dim_pessoa','vendas_atribuidas',
  'rd_vendas','rd_leads','planilha_vendas','planilha_leads'
];
BEGIN
  IF NOT (p_table = ANY(allowed)) THEN
    RAISE EXCEPTION 'Tabela não permitida: %', p_table;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name=p_table AND column_name=p_col
  ) THEN
    RAISE EXCEPTION 'Coluna inválida: %.%', p_table, p_col;
  END IF;
END $$;


-- ---------------------------------------------------------------------
-- Helper: monta uma expressão de agregação validada
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._qb_agg_expr(p_table text, p_bring jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  k text := lower(p_bring->>'kind');
  c text := p_bring->>'col';
  ob text := p_bring->>'order_by';      -- ex: "data_lead"
  od text := lower(coalesce(p_bring->>'order_dir','desc'));
  qc text;
  qob text;
BEGIN
  IF od NOT IN ('asc','desc') THEN od := 'desc'; END IF;
  IF k = 'count' THEN RETURN 'count(*)'; END IF;
  PERFORM _qb_assert_col(p_table, c);
  qc := quote_ident(c);
  IF k = 'count_distinct' THEN RETURN format('count(distinct %s)', qc); END IF;
  IF k = 'min'  THEN RETURN format('min(%s)', qc); END IF;
  IF k = 'max'  THEN RETURN format('max(%s)', qc); END IF;
  IF k = 'sum'  THEN RETURN format('sum(%s)', qc); END IF;
  IF k = 'avg'  THEN RETURN format('avg(%s)', qc); END IF;
  IF k = 'list_distinct' THEN
    RETURN format('array_to_string(array_agg(distinct %s::text) FILTER (WHERE %s IS NOT NULL), '', '')', qc, qc);
  END IF;
  IF k IN ('first','last') THEN
    PERFORM _qb_assert_col(p_table, ob);
    qob := quote_ident(ob);
    -- 'first' => menor ordenação asc; 'last' => maior desc
    IF k = 'first' THEN
      RETURN format('(array_agg(%s ORDER BY %s asc NULLS LAST) FILTER (WHERE %s IS NOT NULL))[1]', qc, qob, qc);
    ELSE
      RETURN format('(array_agg(%s ORDER BY %s desc NULLS LAST) FILTER (WHERE %s IS NOT NULL))[1]', qc, qob, qc);
    END IF;
  END IF;
  RAISE EXCEPTION 'Agregação inválida: %', k;
END $$;


-- ---------------------------------------------------------------------
-- Helper: monta predicado de filtro (col,op,val) validado
-- col vem como "base.coluna" ou "j_<n>.coluna" (alias de join)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._qb_filter_expr(p_filter jsonb, p_base text, p_join_aliases jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  raw_col text := p_filter->>'col';
  op text := lower(coalesce(p_filter->>'op','='));
  v jsonb := p_filter->'val';
  parts text[];
  prefix text;
  colname text;
  qcol text;
  vtxt text;
  arr text[];
BEGIN
  IF raw_col IS NULL OR position('.' IN raw_col) = 0 THEN
    RAISE EXCEPTION 'Filtro inválido: coluna deve ser "base.col" ou "j_N.col"';
  END IF;
  parts := string_to_array(raw_col, '.');
  prefix := parts[1]; colname := parts[2];

  IF prefix = 'base' THEN
    PERFORM _qb_assert_col(p_base, colname);
    qcol := format('b.%s', quote_ident(colname));
  ELSIF p_join_aliases ? prefix THEN
    -- coluna agregada — é o alias do SELECT (já validado ao montar o LATERAL)
    qcol := quote_ident(prefix || '_' || colname);
  ELSE
    RAISE EXCEPTION 'Prefixo de filtro inválido: %', prefix;
  END IF;

  IF op = 'is_null' THEN RETURN qcol || ' IS NULL'; END IF;
  IF op = 'is_not_null' THEN RETURN qcol || ' IS NOT NULL'; END IF;

  IF op IN ('in','not_in') THEN
    SELECT array_agg(quote_literal(x)) INTO arr FROM jsonb_array_elements_text(v) x;
    IF arr IS NULL OR array_length(arr,1)=0 THEN RETURN 'true'; END IF;
    RETURN format('%s %s (%s)', qcol, CASE WHEN op='in' THEN 'IN' ELSE 'NOT IN' END, array_to_string(arr,','));
  END IF;

  IF op = 'between' THEN
    RETURN format('%s BETWEEN %L AND %L', qcol, v->>0, v->>1);
  END IF;

  vtxt := CASE jsonb_typeof(v) WHEN 'string' THEN v#>>'{}' ELSE v::text END;

  IF op = 'ilike' THEN RETURN format('%s::text ILIKE %L', qcol, '%'||vtxt||'%'); END IF;
  IF op = 'contains' THEN RETURN format('%s::text ILIKE %L', qcol, '%'||vtxt||'%'); END IF;
  IF op IN ('=','<>','>','>=','<','<=') THEN
    RETURN format('%s %s %L', qcol, op, vtxt);
  END IF;
  RAISE EXCEPTION 'Operador inválido: %', op;
END $$;


-- ---------------------------------------------------------------------
-- query_builder principal
-- p_query JSON shape:
-- { base, joins:[{table, alias?, on:[[base_col,target_col],...], bring:[{kind,col?,order_by?,order_dir?,as}]}],
--   filters:[{col:"base.x"|"j_0.qtd",op,val}],
--   order_by:[{col,dir}], limit, offset, select_base?:[col,...] }
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.query_builder(p_query jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_base text;
  v_select text;
  v_lateral text := '';
  v_where text := 'true';
  v_orderby text := '';
  v_limit int := 200;
  v_offset int := 0;
  v_join jsonb;
  v_bring jsonb;
  v_join_idx int := 0;
  v_alias text;
  v_pair jsonb;
  v_join_on text;
  v_pairs text[];
  v_select_aggs text[];
  v_join_aliases jsonb := '{}'::jsonb;
  v_filter jsonb;
  v_filter_clauses text[];
  v_order jsonb;
  v_order_clauses text[];
  v_select_base text;
  v_select_cols text[];
  v_col text;
  v_sql text;
  v_count_sql text;
  v_rows jsonb;
  v_total bigint;
  v_outer_select text;
BEGIN
  IF auth.uid() IS NULL OR NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  v_base := p_query->>'base';
  IF v_base IS NULL THEN RAISE EXCEPTION 'base obrigatória'; END IF;
  PERFORM _qb_assert_col(v_base, (SELECT column_name FROM information_schema.columns
                                  WHERE table_schema='public' AND table_name=v_base LIMIT 1));

  v_limit := LEAST(GREATEST(coalesce((p_query->>'limit')::int, 200), 1), 5000);
  v_offset := GREATEST(coalesce((p_query->>'offset')::int, 0), 0);

  -- SELECT base.*
  IF p_query ? 'select_base' AND jsonb_array_length(p_query->'select_base') > 0 THEN
    v_select_cols := ARRAY[]::text[];
    FOR v_col IN SELECT jsonb_array_elements_text(p_query->'select_base') LOOP
      PERFORM _qb_assert_col(v_base, v_col);
      v_select_cols := v_select_cols || format('b.%s AS %s', quote_ident(v_col), quote_ident(v_col));
    END LOOP;
    v_select_base := array_to_string(v_select_cols, ', ');
  ELSE
    v_select_base := 'b.*';
  END IF;

  -- JOINS via LATERAL agregado
  IF p_query ? 'joins' THEN
    FOR v_join IN SELECT jsonb_array_elements(p_query->'joins') LOOP
      v_alias := 'j' || v_join_idx;
      v_join_aliases := v_join_aliases || jsonb_build_object(v_alias, v_join->>'table');

      -- ON: lista de pares OR
      v_pairs := ARRAY[]::text[];
      FOR v_pair IN SELECT jsonb_array_elements(v_join->'on') LOOP
        PERFORM _qb_assert_col(v_base, v_pair->>0);
        PERFORM _qb_assert_col(v_join->>'table', v_pair->>1);
        v_pairs := v_pairs || format('(b.%s IS NOT NULL AND t.%s = b.%s)',
                                     quote_ident(v_pair->>0), quote_ident(v_pair->>1), quote_ident(v_pair->>0));
      END LOOP;
      IF array_length(v_pairs,1) IS NULL THEN RAISE EXCEPTION 'join sem chaves'; END IF;
      v_join_on := '(' || array_to_string(v_pairs, ' OR ') || ')';

      -- BRING: agregações
      v_select_aggs := ARRAY[]::text[];
      FOR v_bring IN SELECT jsonb_array_elements(v_join->'bring') LOOP
        v_select_aggs := v_select_aggs || format('%s AS %s',
          _qb_agg_expr(v_join->>'table', v_bring),
          quote_ident(v_alias || '_' || (v_bring->>'as')));
      END LOOP;
      IF array_length(v_select_aggs,1) IS NULL THEN
        v_select_aggs := ARRAY[ format('count(*) AS %s', quote_ident(v_alias || '_count')) ];
      END IF;

      v_lateral := v_lateral || format(
        ' LEFT JOIN LATERAL (SELECT %s FROM public.%I t WHERE %s) %I ON true',
        array_to_string(v_select_aggs, ', '),
        v_join->>'table',
        v_join_on,
        v_alias
      );
      v_join_idx := v_join_idx + 1;
    END LOOP;
  END IF;

  -- ORDER BY (apenas em colunas base por simplicidade)
  IF p_query ? 'order_by' AND jsonb_array_length(p_query->'order_by') > 0 THEN
    v_order_clauses := ARRAY[]::text[];
    FOR v_order IN SELECT jsonb_array_elements(p_query->'order_by') LOOP
      PERFORM _qb_assert_col(v_base, v_order->>'col');
      v_order_clauses := v_order_clauses || format('b.%s %s NULLS LAST',
        quote_ident(v_order->>'col'),
        CASE WHEN lower(coalesce(v_order->>'dir','desc')) = 'asc' THEN 'ASC' ELSE 'DESC' END);
    END LOOP;
    v_orderby := ' ORDER BY ' || array_to_string(v_order_clauses, ', ');
  END IF;

  -- WHERE: precisamos envolver em subquery porque filtros podem referenciar colunas de joins (aliases)
  IF p_query ? 'filters' AND jsonb_array_length(p_query->'filters') > 0 THEN
    v_filter_clauses := ARRAY[]::text[];
    FOR v_filter IN SELECT jsonb_array_elements(p_query->'filters') LOOP
      v_filter_clauses := v_filter_clauses || _qb_filter_expr(v_filter, v_base, v_join_aliases);
    END LOOP;
    v_where := array_to_string(v_filter_clauses, ' AND ');
  END IF;

  -- Monta SQL externo: SELECT * FROM ( base + lateral ) sub WHERE filtros
  v_sql := format(
    'SELECT row_to_json(sub) AS r FROM (SELECT %s%s FROM public.%I b%s) sub WHERE %s%s LIMIT %s OFFSET %s',
    v_select_base,
    CASE WHEN v_join_idx > 0 THEN ', ' || (
      SELECT string_agg(format('%I.*', a), ', ') FROM jsonb_object_keys(v_join_aliases) a
    ) ELSE '' END,
    v_base, v_lateral,
    v_where,
    v_orderby, v_limit, v_offset
  );

  v_count_sql := format(
    'SELECT count(*) FROM (SELECT b.venda_id_dummy FROM (SELECT 1 AS venda_id_dummy%s FROM public.%I b%s) sub WHERE %s) c',
    CASE WHEN v_join_idx > 0 THEN ', ' || (
      SELECT string_agg(format('%I.*', a), ', ') FROM jsonb_object_keys(v_join_aliases) a
    ) ELSE '' END,
    v_base, v_lateral, v_where
  );

  EXECUTE format('SELECT COALESCE(jsonb_agg(r), ''[]''::jsonb) FROM (%s) t', v_sql) INTO v_rows;
  -- contagem total ignorando limit/offset
  v_outer_select := format(
    'SELECT count(*)::bigint FROM (SELECT %s%s FROM public.%I b%s) sub WHERE %s',
    v_select_base,
    CASE WHEN v_join_idx > 0 THEN ', ' || (
      SELECT string_agg(format('%I.*', a), ', ') FROM jsonb_object_keys(v_join_aliases) a
    ) ELSE '' END,
    v_base, v_lateral, v_where
  );
  EXECUTE v_outer_select INTO v_total;

  RETURN jsonb_build_object('rows', v_rows, 'total', v_total, 'sql', v_sql);
END $$;