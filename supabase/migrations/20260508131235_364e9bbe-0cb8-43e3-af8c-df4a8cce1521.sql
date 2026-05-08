
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE workspace_role AS ENUM ('admin','editor','viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE rel_cardinality AS ENUM ('one_one','one_many','many_one','many_many');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE rel_direction AS ENUM ('single','both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ TABLES ============
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role workspace_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.ds_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  row_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ds_sources_ws ON public.ds_sources(workspace_id);

CREATE TABLE IF NOT EXISTS public.ds_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.ds_sources(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  ordinal int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ds_columns_src ON public.ds_columns(source_id);

CREATE TABLE IF NOT EXISTS public.ds_rows (
  id bigserial PRIMARY KEY,
  source_id uuid NOT NULL REFERENCES public.ds_sources(id) ON DELETE CASCADE,
  data jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ds_rows_src ON public.ds_rows(source_id);
CREATE INDEX IF NOT EXISTS idx_ds_rows_data ON public.ds_rows USING gin(data);

CREATE TABLE IF NOT EXISTS public.data_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_data_models_ws ON public.data_models(workspace_id);

CREATE TABLE IF NOT EXISTS public.model_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.data_models(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.ds_sources(id) ON DELETE CASCADE,
  x numeric NOT NULL DEFAULT 0,
  y numeric NOT NULL DEFAULT 0,
  UNIQUE (model_id, source_id)
);
CREATE INDEX IF NOT EXISTS idx_model_nodes_model ON public.model_nodes(model_id);

CREATE TABLE IF NOT EXISTS public.relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.data_models(id) ON DELETE CASCADE,
  from_source uuid NOT NULL REFERENCES public.ds_sources(id) ON DELETE CASCADE,
  to_source uuid NOT NULL REFERENCES public.ds_sources(id) ON DELETE CASCADE,
  cardinality rel_cardinality NOT NULL DEFAULT 'one_many',
  direction rel_direction NOT NULL DEFAULT 'single',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_relationships_model ON public.relationships(model_id);

CREATE TABLE IF NOT EXISTS public.relationship_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.relationships(id) ON DELETE CASCADE,
  from_col text NOT NULL,
  to_col text NOT NULL,
  ord int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_relcols_rel ON public.relationship_columns(relationship_id);

-- ============ HELPER ============
CREATE OR REPLACE FUNCTION public.is_workspace_member(_ws uuid, _role workspace_role DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = _ws AND user_id = auth.uid()
      AND (_role IS NULL OR role = _role
           OR (_role = 'editor' AND role = 'admin')
           OR (_role = 'viewer'))
  )
$$;

-- ============ RLS ============
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ds_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ds_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ds_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY ws_select ON public.workspaces FOR SELECT TO authenticated
  USING (is_workspace_member(id) OR owner_id = auth.uid());
CREATE POLICY ws_insert ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY ws_update ON public.workspaces FOR UPDATE TO authenticated
  USING (is_workspace_member(id, 'admin') OR owner_id = auth.uid());
CREATE POLICY ws_delete ON public.workspaces FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY wsm_select ON public.workspace_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_workspace_member(workspace_id, 'admin'));
CREATE POLICY wsm_insert ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (
    is_workspace_member(workspace_id, 'admin')
    OR EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
  );
CREATE POLICY wsm_delete ON public.workspace_members FOR DELETE TO authenticated
  USING (is_workspace_member(workspace_id, 'admin') OR user_id = auth.uid());

-- Generic: read for any member, write for editor/admin
CREATE POLICY src_r ON public.ds_sources FOR SELECT TO authenticated
  USING (is_workspace_member(workspace_id));
CREATE POLICY src_w ON public.ds_sources FOR ALL TO authenticated
  USING (is_workspace_member(workspace_id, 'admin')) WITH CHECK (is_workspace_member(workspace_id, 'admin'));

CREATE POLICY col_r ON public.ds_columns FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM ds_sources s WHERE s.id = source_id AND is_workspace_member(s.workspace_id)));
CREATE POLICY col_w ON public.ds_columns FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM ds_sources s WHERE s.id = source_id AND is_workspace_member(s.workspace_id, 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM ds_sources s WHERE s.id = source_id AND is_workspace_member(s.workspace_id, 'admin')));

CREATE POLICY row_r ON public.ds_rows FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM ds_sources s WHERE s.id = source_id AND is_workspace_member(s.workspace_id)));
CREATE POLICY row_w ON public.ds_rows FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM ds_sources s WHERE s.id = source_id AND is_workspace_member(s.workspace_id, 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM ds_sources s WHERE s.id = source_id AND is_workspace_member(s.workspace_id, 'admin')));

CREATE POLICY dm_r ON public.data_models FOR SELECT TO authenticated
  USING (is_workspace_member(workspace_id));
CREATE POLICY dm_w ON public.data_models FOR ALL TO authenticated
  USING (is_workspace_member(workspace_id, 'admin')) WITH CHECK (is_workspace_member(workspace_id, 'admin'));

CREATE POLICY mn_r ON public.model_nodes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM data_models m WHERE m.id = model_id AND is_workspace_member(m.workspace_id)));
CREATE POLICY mn_w ON public.model_nodes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM data_models m WHERE m.id = model_id AND is_workspace_member(m.workspace_id, 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM data_models m WHERE m.id = model_id AND is_workspace_member(m.workspace_id, 'admin')));

CREATE POLICY rel_r ON public.relationships FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM data_models m WHERE m.id = model_id AND is_workspace_member(m.workspace_id)));
CREATE POLICY rel_w ON public.relationships FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM data_models m WHERE m.id = model_id AND is_workspace_member(m.workspace_id, 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM data_models m WHERE m.id = model_id AND is_workspace_member(m.workspace_id, 'admin')));

CREATE POLICY relc_r ON public.relationship_columns FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM relationships r JOIN data_models m ON m.id = r.model_id
                 WHERE r.id = relationship_id AND is_workspace_member(m.workspace_id)));
CREATE POLICY relc_w ON public.relationship_columns FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM relationships r JOIN data_models m ON m.id = r.model_id
                 WHERE r.id = relationship_id AND is_workspace_member(m.workspace_id, 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM relationships r JOIN data_models m ON m.id = r.model_id
                 WHERE r.id = relationship_id AND is_workspace_member(m.workspace_id, 'admin')));

-- ============ TRIGGER: owner is auto-admin ============
CREATE OR REPLACE FUNCTION public.workspaces_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_workspaces_after_insert ON public.workspaces;
CREATE TRIGGER trg_workspaces_after_insert AFTER INSERT ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.workspaces_after_insert();

-- ============ RPC: import_sheet ============
CREATE OR REPLACE FUNCTION public.import_sheet(
  p_workspace_id uuid,
  p_name text,
  p_columns jsonb,   -- [{name, type}]
  p_rows jsonb       -- [{col: value, ...}]
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_src uuid;
  v_col jsonb;
  v_ord int := 0;
  v_count int;
BEGIN
  IF NOT is_workspace_member(p_workspace_id, 'admin') THEN
    RAISE EXCEPTION 'Acesso negado ao workspace';
  END IF;
  INSERT INTO ds_sources (workspace_id, name, row_count) VALUES (p_workspace_id, p_name, 0)
  RETURNING id INTO v_src;
  FOR v_col IN SELECT jsonb_array_elements(p_columns) LOOP
    INSERT INTO ds_columns (source_id, name, type, ordinal)
    VALUES (v_src, v_col->>'name', coalesce(v_col->>'type','text'), v_ord);
    v_ord := v_ord + 1;
  END LOOP;
  INSERT INTO ds_rows (source_id, data)
  SELECT v_src, value FROM jsonb_array_elements(p_rows);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  UPDATE ds_sources SET row_count = v_count, updated_at = now() WHERE id = v_src;
  RETURN v_src;
END $$;

-- ============ RPC: validate_relationship ============
-- p_pairs: [{from_col, to_col}, ...] (chave composta = múltiplos pares)
CREATE OR REPLACE FUNCTION public.validate_relationship(
  p_from_source uuid,
  p_to_source uuid,
  p_pairs jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ws_l uuid; v_ws_r uuid;
  v_concat_l text := '';
  v_concat_r text := '';
  v_pair jsonb;
  v_first boolean := true;
  v_total_l int; v_total_r int;
  v_matched_l int; v_matched_r int;
  v_max_dup_l int; v_max_dup_r int;
  v_card text;
  v_sql text;
BEGIN
  SELECT workspace_id INTO v_ws_l FROM ds_sources WHERE id = p_from_source;
  SELECT workspace_id INTO v_ws_r FROM ds_sources WHERE id = p_to_source;
  IF v_ws_l IS NULL OR v_ws_r IS NULL OR v_ws_l <> v_ws_r OR NOT is_workspace_member(v_ws_l) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  FOR v_pair IN SELECT jsonb_array_elements(p_pairs) LOOP
    IF NOT v_first THEN
      v_concat_l := v_concat_l || ' || ''|'' || ';
      v_concat_r := v_concat_r || ' || ''|'' || ';
    END IF;
    v_concat_l := v_concat_l || format('lower(coalesce(l.data->>%L, ''''))', v_pair->>'from_col');
    v_concat_r := v_concat_r || format('lower(coalesce(r.data->>%L, ''''))', v_pair->>'to_col');
    v_first := false;
  END LOOP;

  EXECUTE format(
    'WITH l AS (SELECT %s AS k FROM ds_rows l WHERE source_id = %L),
          r AS (SELECT %s AS k FROM ds_rows r WHERE source_id = %L),
          lk AS (SELECT k, count(*) c FROM l WHERE k <> '''' GROUP BY k),
          rk AS (SELECT k, count(*) c FROM r WHERE k <> '''' GROUP BY k)
     SELECT
       (SELECT count(*) FROM l),
       (SELECT count(*) FROM r),
       (SELECT count(*) FROM l WHERE k IN (SELECT k FROM rk)),
       (SELECT count(*) FROM r WHERE k IN (SELECT k FROM lk)),
       coalesce((SELECT max(c) FROM lk),0),
       coalesce((SELECT max(c) FROM rk),0)',
    v_concat_l, p_from_source, v_concat_r, p_to_source
  ) INTO v_total_l, v_total_r, v_matched_l, v_matched_r, v_max_dup_l, v_max_dup_r;

  v_card := CASE
    WHEN v_max_dup_l <= 1 AND v_max_dup_r <= 1 THEN 'one_one'
    WHEN v_max_dup_l <= 1 AND v_max_dup_r >  1 THEN 'one_many'
    WHEN v_max_dup_l >  1 AND v_max_dup_r <= 1 THEN 'many_one'
    ELSE 'many_many'
  END;

  RETURN jsonb_build_object(
    'total_left', v_total_l,
    'total_right', v_total_r,
    'matched_left', v_matched_l,
    'matched_right', v_matched_r,
    'cardinality', v_card
  );
END $$;
