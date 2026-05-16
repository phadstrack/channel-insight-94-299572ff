-- ARC3 Core Schema (Generic, Multi-tenant ready)
-- Created: 2026-05-16
-- Purpose: Tables for audits, metrics, findings, recommendations, tracking issues

-- Enable extensions
create extension if not exists "uuid-ossp";

-- arc3_audits: Main audit sessions
create table arc3_audits (
  id uuid primary key default uuid_generate_v4(),
  client_name text not null,
  objectives text[] default array[]::text[],
  status text check (status in ('draft', 'in_progress', 'analysis', 'completed')) default 'draft',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone
);

-- arc3_data_sources: Connected data sources for each audit
create table arc3_data_sources (
  id uuid primary key default uuid_generate_v4(),
  audit_id uuid not null references arc3_audits(id) on delete cascade,
  source_type text check (source_type in ('csv', 'json', 'meta_ads', 'google_ads', 'ga4', 'salesforce')) not null,
  source_name text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- arc3_normalized_data: Normalized data rows for analysis
create table arc3_normalized_data (
  id uuid primary key default uuid_generate_v4(),
  audit_id uuid not null references arc3_audits(id) on delete cascade,
  data_source_id uuid references arc3_data_sources(id) on delete set null,
  event_date date not null,
  channel text,
  metric_name text,
  metric_value numeric,
  quality_score numeric check (quality_score between 0 and 100) default 100,
  created_at timestamp with time zone default now()
);

-- arc3_metrics: Calculated metrics (ROAS, CPA, etc.)
create table arc3_metrics (
  id uuid primary key default uuid_generate_v4(),
  audit_id uuid not null references arc3_audits(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  roas numeric,
  cpa numeric,
  cac numeric,
  cpc numeric,
  cpm numeric,
  ctr numeric,
  cvr numeric,
  impression_share numeric,
  previous_period_delta numeric,
  yoy_change numeric,
  created_at timestamp with time zone default now()
);

-- arc3_findings: Detected issues (Problemas)
create table arc3_findings (
  id uuid primary key default uuid_generate_v4(),
  audit_id uuid not null references arc3_audits(id) on delete cascade,
  category text check (category in ('performance', 'data_quality', 'tracking', 'setup', 'opportunity')) not null,
  severity text check (severity in ('critical', 'high', 'medium', 'low')) not null,
  title text not null,
  description text,
  detected_by_skill text,
  impact_estimate numeric,
  statistical_significance numeric,
  created_at timestamp with time zone default now()
);

-- arc3_recommendations: Action items (Plano)
create table arc3_recommendations (
  id uuid primary key default uuid_generate_v4(),
  audit_id uuid not null references arc3_audits(id) on delete cascade,
  finding_id uuid references arc3_findings(id) on delete set null,
  title text not null,
  description text,
  priority_score numeric check (priority_score between 0 and 100),
  impact_estimate numeric,
  estimated_effort text check (estimated_effort in ('low', 'medium', 'high')),
  estimated_effort_days integer,
  owner_role text,
  implementation_steps text[] default array[]::text[],
  status text check (status in ('pending', 'implementing', 'implemented', 'dismissed')) default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- arc3_tracking_issues: Detailed tracking problems
create table arc3_tracking_issues (
  id uuid primary key default uuid_generate_v4(),
  audit_id uuid not null references arc3_audits(id) on delete cascade,
  finding_id uuid references arc3_findings(id) on delete cascade,
  issue_type text,
  severity text,
  description text,
  suggested_fix text,
  created_at timestamp with time zone default now()
);

-- arc3_audit_executions: Execution log for audit runs
create table arc3_audit_executions (
  id uuid primary key default uuid_generate_v4(),
  audit_id uuid not null references arc3_audits(id) on delete cascade,
  execution_step text,
  skill_name text,
  status text,
  result jsonb,
  error_message text,
  started_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  duration_seconds integer
);

-- Indexes for performance
create index idx_arc3_audits_client_name on arc3_audits(client_name);
create index idx_arc3_audits_status on arc3_audits(status);
create index idx_arc3_data_sources_audit_id on arc3_data_sources(audit_id);
create index idx_arc3_normalized_data_audit_id on arc3_normalized_data(audit_id);
create index idx_arc3_metrics_audit_id on arc3_metrics(audit_id);
create index idx_arc3_findings_audit_id on arc3_findings(audit_id);
create index idx_arc3_findings_severity on arc3_findings(severity);
create index idx_arc3_recommendations_audit_id on arc3_recommendations(audit_id);
create index idx_arc3_recommendations_priority on arc3_recommendations(priority_score desc);
create index idx_arc3_tracking_issues_audit_id on arc3_tracking_issues(audit_id);

-- Enable Row Level Security (for future multi-tenancy)
alter table arc3_audits enable row level security;
alter table arc3_data_sources enable row level security;
alter table arc3_normalized_data enable row level security;
alter table arc3_metrics enable row level security;
alter table arc3_findings enable row level security;
alter table arc3_recommendations enable row level security;
alter table arc3_tracking_issues enable row level security;
alter table arc3_audit_executions enable row level security;

-- Public policies (for development — tighten in production)
create policy "allow_all_audits" on arc3_audits for all using (true);
create policy "allow_all_data_sources" on arc3_data_sources for all using (true);
create policy "allow_all_normalized_data" on arc3_normalized_data for all using (true);
create policy "allow_all_metrics" on arc3_metrics for all using (true);
create policy "allow_all_findings" on arc3_findings for all using (true);
create policy "allow_all_recommendations" on arc3_recommendations for all using (true);
create policy "allow_all_tracking_issues" on arc3_tracking_issues for all using (true);
create policy "allow_all_executions" on arc3_audit_executions for all using (true);
