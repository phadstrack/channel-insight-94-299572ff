# Architecture Decision Records (ADR)

## ADR-001: Usar TypeScript em vez de JavaScript puro

**Status**: Accepted  
**Date**: 2026-05-15

### Context
Precisamos de uma linguagem que suporte:
- Type safety para dados financeiros (ROAS, CPA, etc)
- Boa documentação IDE
- Compilação para detecção de erros antes da runtime

### Decision
Usar TypeScript em vez de JavaScript puro.

### Consequences
- ✅ Melhor refactoring (rename-safe)
- ✅ Type safety para operações numéricas sensíveis
- ✅ Documentação através de tipos
- ✅ Melhor autocomplete em IDEs
- ❌ Build step necessário
- ❌ Mais verboso que Python

### Alternatives Considered
1. **Python**: Seria melhor para ML (Cientista Dados), mas pior para CLI + web
2. **Golang**: Rápido, mas menos eco-sistema para análise de dados

---

## ADR-002: Usar Supabase (PostgreSQL) em vez de alternativas

**Status**: Accepted  
**Date**: 2026-05-15

### Context
Precisamos armazenar:
- Metadados de auditoria
- Métricas calculadas (milhões de registros potencialmente)
- Findings e recomendações
- Logs de execução

### Decision
Usar Supabase (PostgreSQL gerenciado).

### Consequences
- ✅ ACID transactions
- ✅ Queries complexas (JOINs, window functions)
- ✅ Row-level security built-in
- ✅ Easy to self-host
- ✅ Pricing previsível
- ❌ Menos flexível que NoSQL para dados semi-estruturados
- ❌ Scaling horizontal mais complexo

### Alternatives Considered
1. **MongoDB**: Mais flexível para achados variados, mas sem ACID
2. **Snowflake**: Overkill para nossa escala, caro
3. **BigQuery**: Similar a Snowflake, sem open-source
4. **SQLite**: Local-only, não multi-user

---

## ADR-003: Arquitetura em Camadas (não MVC)

**Status**: Accepted  
**Date**: 2026-05-15

### Context
Temos várias responsabilidades distintas:
- Data collection (múltiplas fontes)
- Analysis (cálculos complexos)
- Tracking audits (validações especializadas)
- Finding detection (rules + ML)
- Recommendations (scoring + RACI)
- Reporting (múltiplos formatos)

### Decision
Usar arquitetura em camadas:
```
CLI → Orchestration → Data/Analysis/Tracking → Findings → Recommendations → Reports → DB
```

### Consequences
- ✅ Cada camada tem responsabilidade única
- ✅ Testes unitários facilitados
- ✅ Reutilização entre projetos
- ✅ Fácil de paralelizar (Data + Analysis + Tracking)
- ❌ Mais arquivos que MVC
- ❌ Mais abstrações

---

## ADR-004: 10 Skills Especializadas em vez de IA Genérica

**Status**: Accepted  
**Date**: 2026-05-15

### Context
Auditoria de marketing requer expertise em múltiplos domínios:
- Estratégia (CMO)
- Operação de ads (Google, Meta, etc)
- Análise de dados (SQL, EDA)
- Ciência de dados (ML, causal inference)
- Tracking & measurement

### Decision
Criar 10 skills sênior especializadas, cada uma com seu prompt e metodologia.

### Consequences
- ✅ Expertise consistente em cada domínio
- ✅ Respostas mais precisas
- ✅ Fácil adicionar novos especialistas
- ✅ Possibilidade de rodar skills em paralelo
- ❌ Mais setup inicial
- ❌ Precisa manter cada skill atualizada

### Skills
1. CMO Sênior
2. Gerente Marketing Sênior
3. Analista Marketing Sênior
4. Gestor Google Ads Sênior
5. Gestor Meta Ads Sênior
6. Analista Dados Sênior
7. Cientista Dados Sênior
8. Engenheiro Dados Sênior
9. Construtor Dashboards Sênior
10. Especialista Tracking & UTMs ✨

---

## ADR-005: Tracking como Camada Separada (não integrada em Analysis)

**Status**: Accepted  
**Date**: 2026-05-15

### Context
Tracking (pixels, UTMs, GA4, GTM) é um domínio especializado com:
- Muitas variações de implementação
- Impacto direto na qualidade de dados
- Metodologia própria (GTM, pixels, server-side)
- Ownership diferente do day-to-day de análise

### Decision
Criar `src/core/tracking/` como camada independente, não dentro de Analysis.

### Consequences
- ✅ Especialista em Tracking tem seu próprio workflow
- ✅ Tracking audit pode rodar independentemente
- ✅ Achados de tracking separados
- ✅ Relatórios tracking específicos
- ❌ Precisa coordenar resultados de Tracking + Analysis
- ❌ Um pouco mais de complexidade

---

## ADR-006: Recomendações com Scoring (não apenas ordenadas por impacto)

**Status**: Accepted  
**Date**: 2026-05-15

### Context
Recomendações têm dois eixos:
- **Impacto**: Quanto pode melhorar (ROAS +15%, CPA -20%)
- **Esforço**: Quanto trabalho (2h, 3 dias, 1 sprint)

### Decision
Implementar scoring que combina ambas dimensões:
```
priority_score = (impact * 0.6) + (urgency * 0.3) + (ease_inverse * 0.1)
```

### Consequences
- ✅ Priorização realista (nem sempre o impacto maior é o próximo a fazer)
- ✅ Liderança pode ver esforço vs impacto
- ✅ Facilita roadmap
- ❌ Fórmula precisa ser ajustada por cliente
- ❌ Mais complexo que ordenação simples

---

## ADR-007: Suportar Entrada de Dados Híbrida (upload + APIs)

**Status**: Accepted  
**Date**: 2026-05-15

### Context
Clientes têm contextos diferentes:
- Alguns têm acesso direto a APIs (Google, Meta)
- Alguns só conseguem exportar CSVs
- Alguns têm dados em Salesforce/HubSpot

### Decision
Suportar múltiplas fontes:
- CSV upload (rápido, sem credenciais)
- JSON (estruturado, local ou remoto)
- APIs diretas (Meta, Google, GA4, Salesforce)
- Webhooks (servidor → servidor)

### Consequences
- ✅ Funciona com qualquer cliente
- ✅ Sem barreira de credenciais
- ✅ Escalável para integração direta
- ❌ Mais formatos para validar
- ❌ Mais testes necessários

---

## ADR-008: UTC em toda a análise, horário local apenas em reports

**Status**: Accepted  
**Date**: 2026-05-15

### Context
Dados vêm de múltiplos fusos horários (Meta em São Paulo, Google em NY, etc).

### Decision
- Armazenar tudo em UTC no DB
- Computar análises em UTC
- Mostrar em horário local apenas em reports (configurável por cliente)

### Consequences
- ✅ Sem bugs de timezone
- ✅ Dados consistes globalmente
- ✅ Fácil comparações
- ❌ Precisa documentar conversão nos reports

---

## ADR-009: Stateless CLI, tudo em DB

**Status**: Accepted  
**Date**: 2026-05-15

### Context
Auditoria pode levar horas (importar dados, APIs lentas, análise pesada).

### Decision
- CLI é stateless (sem arquivo temporário no disco)
- Tudo vai em Supabase
- Possível retomar auditoria interrompida

### Consequences
- ✅ Fácil distribuir processamento (múltiplos workers)
- ✅ Auditoria persistida (pode retomar)
- ✅ Transparência (ver progress no DB)
- ❌ Mais queries ao DB
- ❌ Caching precisa ir no Redis (se implementar)

---

## ADR-010: Recomendações com Owner Roles (RACI-style)

**Status**: Accepted  
**Date**: 2026-05-15

### Context
Recomendações precisam chegar na pessoa certa:
- "Aumentar bid" → Google Ads Manager
- "Melhorar landing page" → Growth/Product
- "Implementar server-side tracking" → Data/Engineering
- "Revisar messaging" → Copywriter/Creative

### Decision
Cada recomendação tem um `owner_role` field, com sugestão automática baseada na categoria.

### Consequences
- ✅ Recomendações chegam na pessoa certa
- ✅ Facilita follow-up
- ✅ Suporta RACI (Responsible, Accountable, Consulted, Informed)
- ❌ Precisa mapear roles para cada cliente
- ❌ Roles podem não existir em empresas pequenas

---

## ADR-011: Fase 1 = MVP apenas, sem UI

**Status**: Accepted  
**Date**: 2026-05-15

### Context
Determinar escopo da Fase 1 vs Fase 2+.

### Decision
Fase 1 = Backend + CLI + Relatórios HTML simples.
Fase 2+ = Dashboard React, mais fontes de dados, etc.

### Consequences
- ✅ MVP mais rápido
- ✅ Backend robusto primeira
- ✅ Flexibilidade em UI depois
- ❌ Sem visualização ao vivo (mas HTML funciona)
- ❌ Menos atraente visualmente inicialmente

---

## Próximas ADRs a Considerar

- ADR-012: Cache strategy (Redis vs DB)
- ADR-013: Async job processing (Bull, Resque, etc)
- ADR-014: Multi-tenancy (por cliente ou por workspace)
- ADR-015: Versionamento de recomendações
- ADR-016: Integração com Slack/Teams para alertas
- ADR-017: Export de dados em formatos específicos (PowerPoint, PDF)
