# ARC3 Skills Integration Guide

## Overview

The ARC3 Marketing Audit Framework leverages **10 specialized skills** that work together as a team of senior experts, each bringing their own expertise and methodology to different phases of the audit.

## The 10 Skills

### Strategic Layer
1. **CMO Sênior** (Chief Marketing Officer)
   - Decisions on GTM strategy, positioning, P&L alignment
   - Business objective definition
   - Aligns audit findings with company strategy

2. **Gerente de Marketing Sênior** (Senior Marketing Manager)
   - Campaign orchestration and calendar management
   - Agency management and OKR planning
   - Integrated multi-channel planning

### Operational - Paid Traffic Layer
3. **Gestor Google Ads Sênior** (Senior Google Ads Manager)
   - Search, PMax, YouTube, Shopping, App campaigns
   - Smart bidding strategies and tracking setup
   - GA4 integration optimization

4. **Gestor Meta Ads Sênior** (Senior Meta Ads Manager)
   - Facebook, Instagram, Messenger, Threads
   - CAPI and ASC implementation
   - Creative testing and iOS optimization

### Analytical Layer
5. **Analista de Marketing Sênior** (Senior Marketing Analyst)
   - Multi-channel performance analysis
   - Attribution and CAC blended analysis
   - UTM strategy and governance

6. **Analista de Dados Sênior** (Senior Data Analyst)
   - Advanced SQL, EDA (Exploratory Data Analysis)
   - RFM segmentation and cohort analysis
   - Data storytelling and visualization

7. **Cientista de Dados Sênior** (Senior Data Scientist)
   - Predictive modeling and causal inference
   - A/B testing and MMM (Market Mix Modeling)
   - Statistical validation of findings

### Technical/Infrastructure Layer
8. **Engenheiro de Dados Sênior** (Senior Data Engineer)
   - ELT/ETL pipeline design
   - Data quality and observability
   - API integrations (Fivetran, Airbyte, CDC)

9. **Construtor de Dashboards Sênior** (Senior Dashboard Builder)
   - Executive and operational dashboard design
   - Semantic layer and LookML/dbt configuration
   - Self-service analytics enablement

### Specialized Layer
10. **Especialista em Tracking & UTMs** (Tracking & UTM Expert)
    - Pixel implementation and validation
    - UTM naming conventions and governance
    - GA4 event tracking setup
    - GTM implementation and validation
    - Server-side tracking and CRM sync

## Audit Workflow with Skills

### Phase 1: SETUP (CMO + Gerente Marketing)

**When**: Beginning of audit, before data collection
**Primary Skills**: CMO, Marketing Manager
**Outputs**: Clear audit objectives, stakeholder alignment, scope definition

```
CMO defines:
  - Strategic objectives ("increase ROAS to 3.5x")
  - KPIs to optimize
  - Business constraints

Marketing Manager defines:
  - Timeline and milestones
  - Data sources to analyze
  - Team assignments
```

### Phase 2: DATA COLLECTION (Engenheiro Dados + Gestores Ads)

**When**: After setup, connecting to data sources
**Primary Skills**: Data Engineer, Google Ads Manager, Meta Ads Manager
**Outputs**: Normalized and validated dataset

```
Data Engineer:
  - Sets up data pipelines
  - Validates data quality
  - Ensures consistency

Google Ads Manager:
  - Connects Google Ads API
  - Extracts campaign structure and metrics
  - Validates tracking setup

Meta Ads Manager:
  - Connects Meta Ads API
  - Extracts account structure
  - Reviews CAPI implementation
```

### Phase 3: ANALYSIS (Analista Marketing + Analista Dados + Cientista Dados)

**When**: After data collection, before findings
**Primary Skills**: Marketing Analyst, Data Analyst, Data Scientist
**Outputs**: Insights, anomalies, performance metrics

```
Marketing Analyst:
  - Multi-channel performance review
  - Channel mix analysis
  - CAC blended calculation

Data Analyst:
  - EDA and cohort analysis
  - RFM segmentation
  - Trend analysis

Data Scientist:
  - Anomaly detection
  - Predictive modeling
  - Statistical significance testing
```

### Phase 4: FINDINGS & VALIDATION (Cientista Dados leads)

**When**: After analysis, before recommendations
**Primary Skills**: Data Scientist, supporting all others
**Outputs**: Validated findings with statistical significance

```
Data Scientist validates:
  - Statistical significance of findings
  - Causal relationships (not just correlation)
  - Confidence intervals and p-values

Other skills contribute:
  - Domain expertise for interpretation
  - Business context for prioritization
```

### Phase 5: RECOMMENDATIONS (Gerente Marketing + CMO)

**When**: After findings, creating action items
**Primary Skills**: Marketing Manager, CMO
**Outputs**: Prioritized action plan with ownership

```
Marketing Manager:
  - Defines implementation steps
  - Estimates effort (low/medium/high)
  - Assigns owners by role

CMO:
  - Validates alignment with strategy
  - Sets priorities based on business impact
  - Defines success metrics
```

### Phase 6: REPORTING (Construtor Dashboards + Analista Dados)

**When**: After recommendations, presenting findings
**Primary Skills**: Dashboard Builder, Data Analyst
**Outputs**: Executive summary + detailed analysis

```
Dashboard Builder:
  - Designs visual layout
  - Creates interactive charts
  - Ensures clarity and impact

Data Analyst:
  - Writes compelling narratives
  - Provides context for each finding
  - Explains "so what?" for each metric
```

### Phase 7: GOVERNANCE & IMPLEMENTATION (All skills)

**When**: After reporting, during implementation
**Primary Skills**: Marketing Manager, CMO
**Supporting**: All skills for validation of implementation

## Integration Matrix

| Phase | Setup | Data | Analysis | Findings | Reco | Report | Impl |
|-------|-------|------|----------|----------|------|--------|------|
| CMO | ⭐ | - | - | - | ⭐ | - | ⭐ |
| Gerente | ⭐ | - | - | - | ⭐ | - | ⭐ |
| Analista MKT | - | - | ⭐ | ✓ | ✓ | - | - |
| Analista Dados | - | - | ⭐ | ✓ | - | ⭐ | - |
| Cientista | - | - | ⭐ | ⭐ | - | - | - |
| Google Ads | - | ⭐ | ✓ | - | - | - | ✓ |
| Meta Ads | - | ⭐ | ✓ | - | - | - | ✓ |
| Engenheiro | - | ⭐ | - | - | - | - | ✓ |
| Dashboard | - | - | - | - | - | ⭐ | - |
| Tracking | - | ✓ | - | ⭐ | ✓ | - | ✓ |

**Legend**: ⭐ = Primary skill, ✓ = Supporting skill, - = Not involved

## How to Invoke Skills

Each skill is invoked through the `SkillOrchestrator` at the appropriate phase:

```typescript
import { SkillOrchestrator } from '@/arc3/skills';

// During SETUP phase
const setup = await SkillOrchestrator.invokeCMO({
  auditId: 'audit-123',
  objectives: ['increase_roas', 'reduce_cpa'],
  context: { clientName: 'Acme Corp' }
});

// During DATA COLLECTION phase
const dataSetup = await SkillOrchestrator.invokeDataEngineer({
  auditId: 'audit-123',
  dataSources: ['csv', 'meta_ads', 'google_ads']
});

// During ANALYSIS phase
const analysis = await SkillOrchestrator.invokeDataScientist({
  auditId: 'audit-123',
  metrics: calculatedMetrics,
  historicalData: previousPeriodMetrics
});

// During FINDINGS phase
const validated = await SkillOrchestrator.validateFindings({
  auditId: 'audit-123',
  findings: detectedFindings,
  requiredSkills: ['data-scientist', 'marketing-analyst']
});
```

## Skill Context and Prompting

Each skill operates with specialized context:

- **CMO Context**: Business strategy, competitive landscape, long-term goals
- **Marketing Manager Context**: Campaign calendars, team structure, resource constraints
- **Google Ads Manager Context**: Search intent, quality score mechanics, bidding algorithms
- **Meta Ads Context**: Creative performance, CAPI events, lookalike optimization
- **Data Analyst Context**: SQL patterns, ETL pipelines, data governance
- **Data Scientist Context**: Statistical methods, model validation, causal inference
- **Tracking Expert Context**: Pixel implementation, GTM triggers, UTM conventions, GA4 events

## Parallel Execution

Some skills can work in parallel during the same phase:

**During DATA COLLECTION**:
- Google Ads Manager + Meta Ads Manager can extract data simultaneously
- Data Engineer can validate structure in parallel

**During ANALYSIS**:
- Marketing Analyst + Data Analyst can work independently
- Data Scientist validates findings from both

## Error Handling and Escalation

If a skill raises a concern, the workflow escalates:

1. **Data Quality Issue** → Data Engineer validates/fixes
2. **Statistical Insignificance** → Data Scientist explains or dismisses
3. **Strategic Misalignment** → CMO reviews and realigns
4. **Implementation Blocker** → Marketing Manager replans timeline

## Next Steps

- Implement skill invocation handlers in `src/arc3/skills/orchestrator.ts`
- Create skill prompts and context in each skill module
- Wire up skill outputs to downstream analysis steps
- Create error handling and escalation flows
