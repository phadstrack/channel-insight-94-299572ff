
CREATE TABLE public.planilha_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_url text NOT NULL,
  aba text NOT NULL,
  linhas_inseridas integer NOT NULL DEFAULT 0,
  linhas_atualizadas integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  erro text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.planilha_leads (
  id bigserial PRIMARY KEY,
  email text,
  telefone text,
  nome text,
  data_lead date,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  origem_lead text,
  canal text,
  raw jsonb,
  import_batch_id uuid REFERENCES public.planilha_imports(id) ON DELETE SET NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_planilha_leads_natural ON public.planilha_leads (
  COALESCE(lower(email), ''),
  COALESCE(data_lead, '1900-01-01'::date),
  COALESCE(utm_source, ''),
  COALESCE(utm_campaign, '')
);
CREATE INDEX idx_planilha_leads_email ON public.planilha_leads (lower(email));
CREATE INDEX idx_planilha_leads_telefone ON public.planilha_leads (telefone);
CREATE INDEX idx_planilha_leads_data ON public.planilha_leads (data_lead);
CREATE INDEX idx_planilha_leads_canal ON public.planilha_leads (canal);

CREATE TABLE public.planilha_vendas (
  id bigserial PRIMARY KEY,
  email text,
  telefone text,
  nome text,
  data_matricula date,
  valor_convertido numeric DEFAULT 0,
  turma text,
  cidade text,
  estado text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  canal text,
  lead_id bigint REFERENCES public.planilha_leads(id) ON DELETE SET NULL,
  lead_data date,
  dias_lead_para_venda integer,
  raw jsonb,
  import_batch_id uuid REFERENCES public.planilha_imports(id) ON DELETE SET NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_planilha_vendas_natural ON public.planilha_vendas (
  COALESCE(lower(email), ''),
  COALESCE(data_matricula, '1900-01-01'::date),
  COALESCE(turma, ''),
  COALESCE(valor_convertido, 0)
);
CREATE INDEX idx_planilha_vendas_email ON public.planilha_vendas (lower(email));
CREATE INDEX idx_planilha_vendas_telefone ON public.planilha_vendas (telefone);
CREATE INDEX idx_planilha_vendas_data ON public.planilha_vendas (data_matricula);
CREATE INDEX idx_planilha_vendas_canal ON public.planilha_vendas (canal);
CREATE INDEX idx_planilha_vendas_lead ON public.planilha_vendas (lead_id);

ALTER TABLE public.planilha_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planilha_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planilha_vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_imports" ON public.planilha_imports FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert_imports" ON public.planilha_imports FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_update_imports" ON public.planilha_imports FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_delete_imports" ON public.planilha_imports FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "auth_read_leads" ON public.planilha_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert_leads" ON public.planilha_leads FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_update_leads" ON public.planilha_leads FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_delete_leads" ON public.planilha_leads FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "auth_read_vendas_p" ON public.planilha_vendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert_vendas_p" ON public.planilha_vendas FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_update_vendas_p" ON public.planilha_vendas FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_delete_vendas_p" ON public.planilha_vendas FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
