# Arquitetura - ARC3 Framework

## Visão Geral: Os 3 Ps

ARC3 é um framework que audita qualquer negócio através de uma metodologia central: **Problemas**, **Progressos** e **Plano**.

```
┌──────────────────────────────────────────────────────────────┐
│                      CLI / Web Interface                      │
│            (Dashboard dos 3 Ps, Auditorias, Relatórios)      │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│                   Audit Orchestration                         │
│        (Gerencia workflow de auditoria por audit_id)          │
└─────────────────────────────┬────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │ Data Layer   │   │ Analysis     │   │ Tracking     │
  │              │   │ Layer        │   │ Layer        │
  ├──────────────┤   ├──────────────┤   ├──────────────┤
  │ • Collector  │   │ • Metrics    │   │ • Pixels     │
  │ • Normalizer │   │ • Anomaly    │   │ • UTM        │
  │ • Validator  │   │   Detection  │   │ • GA4        │
  │ • APIs       │   │ • Comparative│   │ • GTM        │
  │              │   │              │   │ • CRM Sync   │
  └────────────┬─┘   └──────────────┘   └──────────────┘
        │           PROGRESSOS (Métricas Positivas)
        │────────────────────────────────────────────┐
        │                                            │
        └─────────────────────────────────┬──────────┘
                                          │
        ┌─────────────────────────────────▼──────────┐
        │        Findings & Recommendations Layer    │
        ├──────────────────────────────────────────┤
        │ • FindingsDetector      (→ PROBLEMAS)    │
        │ • RecommendationEngine  (→ PLANO)        │
        │ • PriorityScorer                         │
        └────────────────────────┬──────────────────┘
                                 │
        ┌────────────────────────▼──────────────────┐
        │      Reports Layer (3 Ps Summary)        │
        ├──────────────────────────────────────────┤
        │ • Executive Summary (Problemas / Plano)  │
        │ • Detailed Analysis (Progressos)         │
        │ • JSON (Estruturado para integração)     │
        └────────────────────────┬──────────────────┘
                                 │
                ┌────────────────▼─────────────┐
                │  Database (Supabase)         │
                │  arc3_audits                 │
                │  arc3_findings (Problemas)   │
                │  arc3_recommendations (Plano)│
                │  arc3_metrics (Progressos)   │
                └──────────────────────────────┘
```

---

## Layers Detalhadas

### 1. Data Layer (`src/arc3/core/data/`)

Responsável por coletar, normalizar e validar dados de múltiplas fontes.

**Componentes:**
- `collector.ts` - Fetch de dados (CSV, APIs, webhooks)
- `normalizer.ts` - Converte diferentes formatos para schema unificado
- `validator.ts` - Valida integridade, detecta erros e gaps

**Fluxo:**
```
RawData (CSV/APIs) → Normalize → Validate → NormalizedData (pronto para análise)
```

**Saída (para Analysis Layer):**
```typescript
interface NormalizedData {
  audit_id: string;
  date: Date;
  channel: string;        // 'google_ads' | 'meta' | 'organic' | ...
  metric: string;         // 'impressions' | 'clicks' | 'conversions' | ...
  value: number;
  quality_score: number;  // 0–100 (validações passadas)
}
```

---

### 2. Analysis Layer (`src/arc3/core/analysis/`)

Calcula métricas e detecta padrões históricos (**PROGRESSOS**).

**Componentes:**
- `metrics.ts` - Calcula ROAS, CPA, CTR, CVR, CAC, etc.
- `anomaly.ts` - Detecta outliers, mudanças abruptas
- `comparative.ts` - Compara períodos (WoW, MoM, YoY)

**Saída:**
```typescript
interface Metrics {
  // Retorno de Investimento
  roas: number;           // Revenue / Spend
  cpa: number;            // Cost per Acquisition
  cac: number;            // Customer Acquisition Cost
  roi: number;            // (Revenue - Spend) / Spend
  
  // Eficiência
  cpc: number;            // Cost per Click
  cpm: number;            // Cost per 1000 Impressions
  ctr: number;            // Clicks / Impressions
  cvr: number;            // Conversions / Clicks
  
  // Comparações
  previous_period_delta: number;  // % change vs semana anterior
  yoy_change: number;             // Year-over-year %
}
```

**PROGRESSOS = Métrias positivas + Trending em alta**

---

### 3. Tracking Layer (`src/arc3/core/tracking/`)

Auditoria especializada de implementação de tracking (parte dos **PROBLEMAS**).

**Componentes:**
- `tracker-auditor.ts` - Orquestração
- `utm-validator.ts` - Valida consistência e compliance de UTMs
- `pixel-auditor.ts` - Verifica pixels (Meta, Google, custom)
- `ga4-auditor.ts` - Valida eventos GA4, bot filtering
- `gtm-auditor.ts` - Analisa GTM triggers, data layer

**Saída:**
```typescript
interface TrackingAudit {
  pixels: { meta: boolean; google: boolean; custom: string[] };
  utms: { validity_score: number; inconsistencies: string[]; };
  ga4: { events_configured: string[]; missing_fields: string[]; };
  gtm: { triggers: TriggerStatus[]; tags: TagStatus[]; };
  quality: { event_duplication: number; latency_ms: number; };
}
```

---

### 4. Findings Layer (`src/arc3/core/findings/`)

Detecta e classifica **PROBLEMAS**.

**Componentes:**
- `detector.ts` - Aplica regras (data quality, performance, oportunidades)
- `classifier.ts` - Ordena por severity (critical, high, medium, low)

**Saída:**
```typescript
interface Finding {
  id: string;
  audit_id: string;
  category: 'performance' | 'data_quality' | 'tracking' | 'opportunity';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  detected_by_skill: string;  // Qual das 10 skills encontrou
  impact_estimate: number;    // % de impacto estimado
}
```

**PROBLEMAS = Findings com severity + Tracking Issues**

---

### 5. Recommendations Layer (`src/arc3/core/recommendations/`)

Gera recomendações e prioriza pelo **PLANO**.

**Componentes:**
- `engine.ts` - Gera recommendations a partir de findings
- `scorer.ts` - Calcula priority_score (impacto + urgência + facilidade)
- `ownership.ts` - Mapeia para roles (Google Ads Manager, Data Engineer, etc.)

**Scoring:**
```
priority_score = (impacto * 0.6) + (urgência * 0.3) + (facilidade_inversa * 0.1)

Exemplo:
- Impacto: +25% ROAS = 25 pontos
- Urgência: Crítica = 10 pontos
- Facilidade: 2 horas = 8 pontos
- Score final: (25 * 0.6) + (10 * 0.3) + (8 * 0.1) = 19.8 → ALTA
```

**Saída:**
```typescript
interface Recommendation {
  id: string;
  finding_id: string;
  title: string;
  
  priority_score: number;      // 0–100
  impact_estimate: number;     // % uplift esperado
  estimated_effort: 'low' | 'medium' | 'high';
  estimated_effort_days: number;
  
  owner_role: string;          // 'google-ads-manager', 'tracking-expert', etc.
  implementation_steps: string[];
  status: 'pending' | 'implementing' | 'implemented';
}
```

**PLANO = Recomendações priorizadas + Roadmap**

---

### 6. Reports Layer (`src/arc3/core/reports/`)

Gera relatórios profissionais dos **3 Ps**.

**Componentes:**
- `generator.ts` - Orquestração
- `html-builder.ts` - Relatório visual executivo
- `json-builder.ts` - Estruturado para APIs

**Saída:**
- **HTML**: Pronto para apresentar a stakeholders
- **JSON**: Estruturado para integração em sistemas
- **Markdown**: Para documentação

**Estrutura do Relatório:**
```markdown
# Auditoria: Acme Corp

## 🚨 PROBLEMAS (5 findings críticos)
- Tracking incompleto (Meta pixel faltando)
- UTM strategy inconsistente
- CPA 40% acima do target

## 📈 PROGRESSOS (Métricas positivas)
- Google Ads ROAS: 2.8x (↑ 12% MoM)
- Organic: 15% do revenue (estável)

## 🎯 PLANO (13 recomendações)
### Priority 1 (Score 9.5): Implementar server-side tracking
- Impacto estimado: +25% ROAS
- Esforço: 2 dias
- Owner: Data Engineer

### Priority 2 (Score 7.2): Revisar UTM governance
...
```

---

## Integrations (`src/arc3/integrations/`)

### Data Sources
- `csv-adapter.ts` - Parse CSV
- `json-adapter.ts` - JSON loader
- `meta-ads-connector.ts` - Meta Conversions API
- `google-ads-connector.ts` - Google Ads API
- `ga4-connector.ts` - Google Analytics 4 API

---

## Skills Integration (`src/arc3/skills/`)

10 skills especializadas trabalham em paralelo:

1. **CMO Sênior** — Valida objetivos, alinha strategy
2. **Gerente Marketing Sênior** — Prioriza, coordena
3. **Analista Marketing** — Multi-channel analysis
4. **Gestor Google Ads** — Search, Shopping, GA4
5. **Gestor Meta Ads** — Facebook, Instagram, CAPI
6. **Analista Dados** — EDA, SQL, cohorts
7. **Cientista Dados** — Inferência causal, anomalias
8. **Engenheiro Dados** — Pipelines, qualidade
9. **Construtor Dashboards** — Semantic layer
10. **Especialista Tracking** — Pixels, GTM, UTMs

Cada skill é invocada em fases do workflow e contribui com insights específicos que alimentam os **3 Ps**.

---

## Database Schema (Supabase)

7 tabelas principais:

| Tabela | Propósito |
|--------|----------|
| `arc3_audits` | Sessões de auditoria (status, período, cliente) |
| `arc3_data_sources` | Fontes conectadas (Google Ads, Meta, CSV, etc.) |
| `arc3_metrics` | Métricas calculadas (ROAS, CPA, etc.) |
| `arc3_findings` | PROBLEMAS encontrados (com severity) |
| `arc3_recommendations` | PLANO (recommendations com priority_score) |
| `arc3_tracking_issues` | Issues de tracking detalhadas |
| `arc3_executions` | Log de execução (auditoria rodando) |

---

## Workflow de Auditoria (Mapping para 3 Ps)

```
1. CREATE AUDIT
   └─ Inicia AuditSession com objetivos

2. COLLECT DATA
   └─ Data Layer fetch de múltiplas fontes

3. ANALYZE
   ├─ Calcula Metrics (→ PROGRESSOS)
   └─ Detecta Anomalies

4. AUDIT TRACKING
   └─ TrackingAuditor (→ parte dos PROBLEMAS)

5. FINDINGS
   ├─ FindingsDetector (→ PROBLEMAS)
   └─ Severity Classification

6. RECOMMENDATIONS
   ├─ RecommendationEngine (→ PLANO)
   └─ PriorityScorer (0–100)

7. REPORT
   ├─ Agregação dos 3 Ps
   ├─ Executive Summary (Problemas + Plano)
   └─ Detailed Analysis (Progressos + Recomendações)
```

---

## Design Principles

1. **Modular** — Cada layer é testável independentemente
2. **Specialization** — 10 skills trazem expertise sem hiring
3. **Scalable** — Skills rodam em paralelo via SkillOrchestrator
4. **Generic** — Não tied a cliente específico, marketplace-ready
5. **3 Ps Centric** — Tudo converge para Problemas, Progressos, Plano

---

## Próximas Evoluções

- [ ] CLI para rodar auditorias local/headless
- [ ] Integração com mais APIs (Salesforce, HubSpot, Stripe)
- [ ] Machine Learning para detecção de anomalias avançada
- [ ] Real-time alerts quando novos Problemas surgem
- [ ] Marketplace de custom rules/skills
