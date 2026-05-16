# ARC3 — Framework de Auditoria de Vendas, Dados e Marketing

**ARC3** é um framework open-source que audita qualquer negócio para identificar os **3 Ps**: **Problemas**, **Progressos** e **Plano**.

Criado pelos especialistas:
- **Davi Conceição** — Especialista em Automações e IA
- **Raphael Almeida** — Especialista em Tracking e Análise de Dados

---

## O que é ARC3?

Um framework modular que conecta-se à infraestrutura de vendas, dados e marketing de qualquer negócio para:

1. **Identificar Problemas** — Encontra ineficiências em tracking, dados e ROI
2. **Reconhecer Progressos** — Mostra o que está funcionando bem (trends positivos)
3. **Criar Plano** — Gera roadmap de otimizações priorizadas com impacto estimado

A metodologia dos **3 Ps** separa achados em duas categorias:
- **Problemas** — Issues de qualidade de dados, tracking ruins, oportunidades perdidas
- **Progressos** — Métricas positivas, canais ou estratégias que estão gerando ROI
- **Plano** — Recomendações acionáveis, priorizadas por impacto vs esforço

---

## Como funciona

### Fluxo de Auditoria

```
┌─────────────┐
│   Conectar  │  ← Integrar APIs (Google Ads, Meta, GA4, Salesforce, CRM)
│  Data Labs  │     ou upload de dados (CSV, planilhas)
└──────┬──────┘
       │
┌──────▼──────────────────┐
│    Normalizar & Validar │  ← Unificar formatos, detectar erros
│     Qualidade de Dados  │
└──────┬──────────────────┘
       │
┌──────▼────────────────────────────────┐
│  Auditar (10 Skills Especializados)   │  ← CMO, Google Ads Manager, Data Scientist, etc.
│  • Análise de Performance             │
│  • Tracking & Implementação           │
│  • Anomalias & Dados Históricos       │
└──────┬────────────────────────────────┘
       │
┌──────▼──────────────────┐
│   Identificar 3 Ps      │  ← Problemas, Progressos, Plano
│  • Findings por Severity│
│  • Trending & Insights  │
│  • Recomendações Score  │
└──────┬──────────────────┘
       │
┌──────▼──────────────┐
│  Gerar Relatório    │  ← Executivo ou Detalhado (HTML, JSON, MD)
└─────────────────────┘
```

---

## Arquitetura em 7 Camadas

```
┌─────────────────────────────────────┐
│          CLI / Web Interface        │
├─────────────────────────────────────┤
│     Audit Orchestration Layer       │
├─────────────────────────────────────┤
│  Data  │ Analysis │ Tracking │ ...  │
├─────────────────────────────────────┤
│  Findings Detection & Classification │
├─────────────────────────────────────┤
│  Recommendation Engine & Scoring    │
├─────────────────────────────────────┤
│     Report Generation (Múltiplos     │
│      Formatos: HTML, JSON, MD)      │
├─────────────────────────────────────┤
│   Database (Supabase/PostgreSQL)    │
└─────────────────────────────────────┘
```

---

## As 10 Skills Especializadas

ARC3 funciona como um time de 10 especialistas sênior que analisam a auditoria em paralelo:

### Estratégia
1. **CMO Sênior** — Alinhamento com objetivos de negócio
2. **Gerente Marketing Sênior** — Execução e roadmap

### Operações (Paid)
3. **Gestor Google Ads Sênior** — Search, Shopping, YouTube, GA4
4. **Gestor Meta Ads Sênior** — Facebook, Instagram, CAPI, iOS

### Análise
5. **Analista Marketing Sênior** — Multi-channel, atribuição, CAC
6. **Analista Dados Sênior** — SQL, EDA, RFM, cohort
7. **Cientista Dados Sênior** — Inferência causal, testes A/B, detecção de anomalias

### Infraestrutura
8. **Engenheiro Dados Sênior** — Pipelines, qualidade de dados, observabilidade
9. **Construtor Dashboards Sênior** — Semantic layer, self-service analytics
10. **Especialista Tracking & UTMs** — Pixels, implementação, GTM, CRM sync

---

## Metodologia dos 3 Ps

### 1. **Problemas** 🚨
O que está quebrado ou ineficiente:
- Tracking mal implementado (pixels faltando, UTMs inconsistentes)
- Dados com qualidade baixa (duplicatas, campos faltando)
- Canais com ROI negativo ou desconhecido
- Gaps de atribuição

**Severity**: Critical, High, Medium, Low

### 2. **Progressos** 📈
O que está funcionando bem:
- Canais com ROAS > 2x
- Tendências positivas (MoM growth)
- Cohorts com retenção alta
- Implementações corretas

**Impacto**: Onde focar manutenção, por onde expandir

### 3. **Plano** 🎯
Ações recomendadas com priorização:
```
priority_score = (impacto * 0.6) + (urgência * 0.3) + (facilidade_inversa * 0.1)
```

Exemplo:
- **Score 9.5** (High) — Implementar server-side tracking (2 dias, +25% ROAS)
- **Score 7.2** (Medium) — Revisar UTM strategy (+15% attribution accuracy, 1 semana)
- **Score 4.1** (Low) — Otimizar landing pages (+5% CVR, 3 semanas)

---

## Começar Rápido

### Instalação
```bash
git clone https://github.com/yourusername/arc3.git
cd arc3
bun install
```

### Dev Local
```bash
bun dev
# Abre http://localhost:5173
```

### CLI (em breve)
```bash
arc3 create-audit --client "Acme Corp" --objectives "increase_roas,reduce_cpa"
arc3 import-data --source google_ads --file credentials.json
arc3 analyze --audit-id abc123
arc3 report --audit-id abc123 --format html
```

### Supabase (dev)
```bash
supabase start
supabase migration up
```

---

## Estrutura do Repositório

```
arc3/
├── src/
│   ├── arc3/              ← Core framework (types, skills, core logic)
│   ├── routes/            ← Web UI (Audit dashboard)
│   ├── components/        ← Reusable UI components (shadcn + custom)
│   ├── lib/               ← Utilities
│   └── styles.css
├── supabase/
│   └── migrations/        ← Schema (ARC3-generic, não tied a client específico)
├── ARCHITECTURE.md        ← Visão técnica detalhada
├── DECISIONS.md          ← Architecture Decision Records
├── SKILLS_INTEGRATION.md ← Como as 10 skills funcionam
└── README.md             ← Este arquivo
```

---

## Licença

MIT

---

## Contato

- **Davi Conceição** — [dayvison4@gmail.com](mailto:dayvison4@gmail.com)
- **Raphael Almeida** — Tracking Expert

---

Feito com ❤️ para auditar e otimizar negócios.
