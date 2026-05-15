# Arquitetura - ARC3 Marketing Audit Framework

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                          CLI Interface                        │
│  (create-audit, import-data, audit-tracking, analyze, etc)   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                   Audit Orchestration                        │
│  (AuditSession, status management, workflow coordination)   │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │ Data Layer   │   │ Analysis     │   │ Tracking     │
  │              │   │ Layer        │   │ Layer        │
  ├──────────────┤   ├──────────────┤   ├──────────────┤
  │ • Collector  │   │ • Metrics    │   │ • Pixels     │
  │ • Normalizer │   │ • Anomaly    │   │ • UTM        │
  │ • Validator  │   │   Detection  │   │ • GA4        │
  │ • APIs       │   │ • Comparative│   │ • GTM        │
  │              │   │              │   │ • CRM Sync   │
  └──────────────┘   └──────────────┘   └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │ Findings     │   │ Recommendations  │ Reports      │
  │ Detection    │   │ Engine           │ Generator    │
  ├──────────────┤   ├──────────────┤   ├──────────────┤
  │ • Rules      │   │ • Scoring    │   │ • Executive  │
  │ • Classifier │   │ • Prioritize │   │ • Detailed   │
  │ • Severity   │   │ • RACI       │   │ • JSON       │
  │              │   │              │   │ • Markdown   │
  └──────────────┘   └──────────────┘   └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                ┌────────────▼────────────┐
                │  Database (Supabase)    │
                │  (PostgreSQL)           │
                └─────────────────────────┘
```

## Layers

### 1. CLI Layer (`scripts/`)
- Comandos para executar auditoria
- Interface com usuário
- Orquestração de fluxo

**Comandos principais:**
```bash
arc3-audit-cli create-audit     # Criar nova auditoria
arc3-audit-cli import-data      # Importar dados
arc3-audit-cli audit-tracking   # Auditar tracking
arc3-audit-cli analyze          # Executar análises
arc3-audit-cli recommend        # Gerar recomendações
arc3-audit-cli generate-report  # Gerar relatórios
```

### 2. Data Layer (`src/core/data/`)
Responsável por coletar, normalizar e validar dados de múltiplas fontes.

**Componentes:**
- `collector.ts` - Coleta de dados (CSV, JSON, APIs)
- `normalizer.ts` - Normaliza diferentes formatos
- `validator.ts` - Valida integridade dos dados

**Fluxo:**
```
RawData (CSV/JSON/API) → Normalize → Validate → NormalizedData
```

**Tipos:**
```typescript
interface RawData {
  source: 'csv' | 'json' | 'meta_ads' | 'google_ads' | 'capi';
  content: any[];
  metadata: { file_name?: string; url?: string };
}

interface NormalizedData {
  audit_id: string;
  date: Date;
  channel: string;
  metric: string;
  value: number;
  quality_score: number;
}
```

### 3. Analysis Layer (`src/core/analysis/`)
Calcula métricas e detecta anomalias.

**Componentes:**
- `metrics.ts` - Calcula ROAS, CPA, CTR, CPM, CVR, CAC, etc.
- `anomaly.ts` - Detecta outliers e padrões anormais
- `comparative.ts` - Compara períodos (vs semana anterior, ano passado)

**Métricas principais:**
```typescript
interface Metrics {
  // Conversão
  roas: number;           // Revenue / Ad Spend
  cpa: number;            // Cost / Acquisitions
  cac: number;            // Customer Acquisition Cost
  cpc: number;            // Cost / Clicks
  cpm: number;            // Cost / 1000 Impressions
  
  // Qualidade
  ctr: number;            // Clicks / Impressions
  cvr: number;            // Conversions / Clicks
  impression_share: number;
  
  // Comparação
  previous_period_delta: number;  // % change
  yoy_change: number;             // Year-over-year
}
```

### 4. Tracking Layer (`src/core/tracking/`) ✨ NEW
Auditoria especializada de implementação de tracking.

**Componentes:**
- `tracker-auditor.ts` - Orquestração da auditoria
- `utm-validator.ts` - Validação de UTMs
- `event-quality.ts` - Qualidade de eventos
- `data-layer-parser.ts` - GTM Data Layer
- `ga4-validator.ts` - Validação GA4
- `pixel-auditor.ts` - Auditoria de pixels
- `server-side-check.ts` - Validação server-side

**O que audita:**
```typescript
interface TrackingAudit {
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
    event_duplication: number;    // %
    missing_required_fields: number; // %
    latency_ms: number;
  };
}
```

### 5. Findings Layer (`src/core/findings/`)
Detecta e classifica problemas.

**Componentes:**
- `detector.ts` - Detecta achados usando regras
- `classifier.ts` - Classifica por severity e categoria

**Tipos:**
```typescript
interface Finding {
  id: string;
  audit_id: string;
  category: 'performance' | 'data_quality' | 'tracking' | 'setup' | 'opportunity';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  detected_by_skill: string;  // 'data-scientist', 'tracking-expert', etc
  impact_estimate: number;    // % de impacto
  statistical_significance: number; // p-value ou confidence
}
```

### 6. Recommendations Layer (`src/core/recommendations/`)
Gera recomendações priorizadas.

**Componentes:**
- `rules.ts` - Regras de negócio
- `scorer.ts` - Scoring de prioridade
- `tracking-rules.ts` - Regras específicas de tracking

**Scoring:**
```typescript
interface Recommendation {
  id: string;
  finding_id: string;
  title: string;
  description: string;
  
  // Scoring
  priority_score: number;      // 0-100 (impacto + urgência)
  impact_estimate: number;     // % uplift esperado
  estimated_effort: 'low' | 'medium' | 'high';
  estimated_effort_days: number;
  
  // Ownership
  owner_role: string;          // 'google-ads-manager', 'tracking-expert', etc
  
  // Status
  status: 'pending' | 'implementing' | 'implemented' | 'dismissed';
}
```

**Cálculo de Priority:**
```
priority_score = (impact * 0.6) + (urgency * 0.3) + (ease_inverse * 0.1)

Exemplo:
- Impacto: +25% ROAS = 25 pontos
- Urgência: Crítica = 10 pontos
- Facilidade: 2 horas = 8 pontos
- Score final: (25 * 0.6) + (10 * 0.3) + (8 * 0.1) = 19.8 → Prioridade ALTA
```

### 7. Reports Layer (`src/core/reports/`)
Gera relatórios profissionais.

**Componentes:**
- `generator.ts` - Orquestração
- `templates/executive.html` - Resumo executivo
- `templates/detailed.html` - Análise completa
- `templates/tracking-report.html` - Seção tracking

**Formatos de saída:**
- HTML (visual, pronto para apresentar)
- JSON (estruturado, para integração)
- Markdown (para GitHub)

## Integrations (`src/integrations/`)

### Data Sources
- `csv.ts` - CSV parser
- `json.ts` - JSON loader
- `adapter.ts` - Interface genérica

### APIs
- `meta-ads.ts` - Meta Conversions API
- `google-ads.ts` - Google Ads API
- `ga4.ts` - Google Analytics 4 API
- `gtm.ts` - Google Tag Manager API
- `salesforce.ts` - Salesforce CRM API

## Skills Integration (`src/skills/`)

10 skills sênior integradas:
1. `cmo.ts` - CMO Sênior
2. `marketing-manager.ts` - Gerente Marketing
3. `marketing-analyst.ts` - Analista Marketing
4. `data-analyst.ts` - Analista Dados
5. `data-scientist.ts` - Cientista Dados
6. `google-ads-manager.ts` - Gestor Google Ads
7. `meta-ads-manager.ts` - Gestor Meta Ads
8. `data-engineer.ts` - Engenheiro Dados
9. `dashboard-builder.ts` - Construtor Dashboards
10. `tracking-expert.ts` - Especialista Tracking ✨

**Como funciona:**
```typescript
// Skills são chamadas com contexto da auditoria
const skillResult = await invokeSkill('data-scientist', {
  findings: [...],
  metrics: {...},
  context: 'validate_statistical_significance'
});
```

## Database Schema (Supabase)

7 tabelas principais:
1. `audits` - Sessões de auditoria
2. `audit_data_sources` - Fontes de dados conectadas
3. `audit_metrics` - Métricas calculadas
4. `audit_findings` - Achados detectados
5. `audit_recommendations` - Recomendações
6. `tracking_issues` - Issues de tracking
7. `audit_executions` - Log de execução

## Fluxo de Auditoria

```
1. CREATE AUDIT
   ├─ Initialize AuditSession
   ├─ Store in DB
   └─ Suggest specialized skills

2. IMPORT DATA
   ├─ Collector loads raw data
   ├─ Normalizer transforms to standard schema
   ├─ Validator checks quality
   └─ Store in DB

3. AUDIT TRACKING (optional)
   ├─ TrackingAuditor checks pixels, UTMs, GA4, GTM
   ├─ Compare with policies
   ├─ Identify tracking issues
   └─ Store findings

4. ANALYZE
   ├─ MetricsCalculator computes KPIs
   ├─ AnomalyDetector identifies outliers
   ├─ ComparativeAnalyzer checks trends
   └─ Store metrics in DB

5. DETECT FINDINGS
   ├─ Apply rules to metrics
   ├─ Invoke Data Scientist to validate
   ├─ Classify by severity
   └─ Store findings in DB

6. RECOMMEND
   ├─ Generate recommendations from findings
   ├─ Score by impact + effort
   ├─ Assign owner roles
   └─ Store in DB

7. REPORT
   ├─ Generate Executive Summary
   ├─ Generate Detailed Report
   ├─ Include Tracking section
   └─ Export HTML/JSON
```

## Design Decisions

### Why TypeScript?
- Type safety for financial data
- Better IDE support
- Easier to maintain

### Why Supabase?
- PostgreSQL for complex queries
- Real-time updates
- Row-level security for clients
- Easy to self-host if needed

### Why Modular Architecture?
- Each layer is independently testable
- Easy to replace components
- Scales with team size

### Why Skills-based?
- Leverages expertise without hiring
- Consistent methodology
- Reproducible insights

## Error Handling

All layers implement consistent error handling:
```typescript
interface Result<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    context?: any;
  };
}
```

## Monitoring & Observability

Structured logging:
```typescript
logger.info('audit.started', { audit_id, client });
logger.error('data.validation.failed', { error, row_number });
logger.warn('anomaly.detected', { metric, threshold, value });
```

## Performance

- Streaming for large CSV files
- Batch operations to DB (100 records per insert)
- Caching of computations per audit
- Parallel processing of independent analyses

## Security

- Credentials encrypted at rest
- Row-level security (audit belongs to client)
- No secrets in logs
- API keys from environment only
