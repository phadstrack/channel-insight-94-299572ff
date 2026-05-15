// Core types for ARC3 Marketing Audit Framework

// ============ Audit Types ============
export interface AuditSession {
  id: string;
  client_id: string;
  client_name: string;
  audit_period_start: Date;
  audit_period_end: Date;
  objectives: string[];
  status: 'draft' | 'in_progress' | 'analysis' | 'completed';
  assigned_specialists?: string[];
  include_tracking_audit?: boolean;
  created_at: Date;
  updated_at: Date;
}

// ============ Metrics Types ============
export interface Metrics {
  // Core conversions
  roas: number;                    // Revenue / Ad Spend
  cpa: number;                     // Cost Per Action/Acquisition
  cac: number;                     // Customer Acquisition Cost
  cpc: number;                     // Cost Per Click
  cpm: number;                     // Cost Per Mille (1000 impressions)

  // Quality metrics
  ctr: number;                     // Click Through Rate
  cvr: number;                     // Conversion Rate
  impression_share?: number;

  // Volume
  impressions: number;
  clicks: number;
  conversions: number;
  revenue?: number;

  // Comparison
  previous_period_delta: number;   // % change vs previous period
  yoy_change?: number;             // Year-over-year change

  // Quality indicator
  quality_score: number;           // 0-100
}

// ============ Data Types ============
export interface RawData {
  source: 'csv' | 'json' | 'meta_ads' | 'google_ads' | 'ga4' | 'salesforce';
  content: any[];
  metadata?: {
    file_name?: string;
    url?: string;
    timestamp?: Date;
  };
}

export interface NormalizedData {
  audit_id: string;
  date: Date;
  channel: string;
  metric_name: string;
  metric_value: number;
  additional_fields?: Record<string, any>;
  quality_score: number;
}

// ============ Finding Types ============
export interface Finding {
  id: string;
  audit_id: string;
  category: 'performance' | 'data_quality' | 'tracking' | 'setup' | 'opportunity';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  detected_by_skill: string;
  impact_estimate: number;         // % impact
  statistical_significance?: number; // p-value or confidence
  created_at: Date;
}

// ============ Recommendation Types ============
export interface Recommendation {
  id: string;
  audit_id: string;
  finding_id?: string;
  title: string;
  description: string;

  // Scoring
  priority_score: number;          // 0-100
  impact_estimate: number;         // % uplift expected
  estimated_effort: 'low' | 'medium' | 'high';
  estimated_effort_days?: number;

  // Ownership
  owner_role: string;              // 'google-ads-manager', 'tracking-expert', etc
  implementation_steps?: string[];

  // Status
  status: 'pending' | 'implementing' | 'implemented' | 'dismissed';
  created_at: Date;
}

// ============ Tracking Types ============
export interface TrackingIssue {
  id: string;
  audit_id: string;
  issue_type: string; // 'pixel_missing', 'utm_typo', 'event_duplication', etc
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affected_channels: string[]; // ['meta', 'google', 'crm']
  remediation_steps?: string[];
  created_at: Date;
}

export interface TrackingAudit {
  pixels: {
    meta: boolean;
    google: boolean;
    custom: string[];
  };
  utms: {
    validity_score: number;
    inconsistencies: string[];
    policy_compliance: boolean;
  };
  ga4: {
    events_configured: string[];
    missing_fields: string[];
    bot_filtering_enabled: boolean;
  };
  gtm: {
    data_layer_structure: any;
    triggers: { name: string; status: string }[];
    tags: { name: string; status: string }[];
  };
  crm_sync: {
    webhook_status: string;
    last_sync: Date;
    success_rate: number;
  };
  quality: {
    event_duplication: number;
    missing_required_fields: number;
    latency_ms: number;
  };
}

// ============ Report Types ============
export interface Report {
  audit_id: string;
  generated_at: Date;
  client_name: string;
  audit_period: {
    start: Date;
    end: Date;
  };
  summary: {
    total_findings: number;
    critical_findings: number;
    total_recommendations: number;
    highest_priority: Recommendation;
  };
  metrics: Metrics;
  findings: Finding[];
  recommendations: Recommendation[];
  tracking_summary?: TrackingAudit;
}

// ============ Result Types ============
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    context?: any;
  };
}

// ============ Utility Types ============
export type SkillName =
  | 'cmo'
  | 'marketing-manager'
  | 'marketing-analyst'
  | 'data-analyst'
  | 'data-scientist'
  | 'google-ads-manager'
  | 'meta-ads-manager'
  | 'data-engineer'
  | 'dashboard-builder'
  | 'tracking-expert';

export interface SkillInvocation {
  skill: SkillName;
  context: {
    audit_id: string;
    findings?: Finding[];
    metrics?: Metrics;
    [key: string]: any;
  };
}
