
# Plataforma de Auditoria de Vendas & Cruzamento de Leads

Diagnóstico em 3 ângulos (eng. dados / cientista / analista) e proposta de reformulação para garantir **precisão, rastreabilidade e auditabilidade**.

## 1. Diagnóstico atual

**Volumes:**
- `rd_vendas`: 3.977 (80 sem email, 1.674 sem telefone, 3.325 sem utm_source, 0 ids duplicados, 0 valor zero)
- `rd_leads`: **0** (esvaziada)
- `planilha_leads`: 12.000
- `sem_atribuicao`: 642 (tabela paralela, sem RLS, não usada na view)
- `jornada_normalizada`: 3.085 (sem RLS, não consumida)
- `meta_ads_spend` / `google_ads_spend`: 0 (esquema pronto, sem dados, sem RLS)
- `planilha_vendas`: 0 (tabela duplicada de `rd_vendas`)

**Problemas estruturais:**

| # | Problema | Impacto |
|---|---|---|
| P1 | View `vendas_atribuidas` faz match só por chave normalizada — não distingue lead anterior x posterior à venda (vaza atribuição "do futuro") | Falsos positivos |
| P2 | `tipo_atribuicao=Existente` é decidido por `utm_source` da venda, mesmo quando lead casou — mascara origem real | Métrica de canal incorreta |
| P3 | `match_phone` não exclui telefones já casados por email (pode gerar dupla contagem em joins futuros) | Risco em agregações |
| P4 | Sem nenhuma camada de qualidade (DQ): nada flagra emails inválidos, telefones < 10 dígitos, datas no futuro, valores negativos, duplicidade `nome+valor` | Dado entra silenciosamente |
| P5 | Sem lineage / staging — importa direto na "tabela final"; reimport sobrepõe sem versão | Impossível auditar "de onde veio" |
| P6 | Tabelas órfãs: `sem_atribuicao`, `jornada_normalizada`, `planilha_vendas`, `*_ads_spend` (sem RLS, sem uso) | Confusão e risco de privacidade |
| P7 | `rd_leads` esvaziada — view degrada silenciosamente para "Sem Atribuição" | Sem alerta |
| P8 | Front consulta `vendas_atribuidas` com `.limit(20000)` em várias páginas e agrega no client | Inconsistência entre páginas, performance |
| P9 | Sem reconciliação entre fontes (RD x planilhas x ads) | Não dá pra auditar |
| P10 | Dedupe atual de vendas é só por `id_venda` + `(nome, valor)` no import — não resolve casos reais (ex.: mesmo aluno, 2 parcelas, ids diferentes) | Receita potencialmente inflada |

## 2. Arquitetura proposta (camadas em medallion)

```text
RAW (imutável)        → STAGING (tipado+normalizado)  → CORE (entidades)        → MARTS (views p/ UI)
rd_vendas_raw            stg_vendas                       dim_pessoa               vendas_atribuidas
rd_leads_raw             stg_leads                        fct_venda                kpi_diario
planilha_leads_raw       stg_leads_planilha               fct_lead                 audit_overview
ads_*_raw                stg_ads                          bridge_lead_venda        dq_findings
                                                          dim_canal                reconciliacao_fontes
```

- **RAW**: cópia fiel + `import_batch_id`, `imported_at`, `source` — nunca sobrescrita; reimport gera novo batch.
- **STAGING**: views materializadas que aplicam `norm_email`, `norm_phone`, `norm_nome`, parsing de data/valor, e marcam linhas com `dq_flags[]`.
- **CORE**:
  - `dim_pessoa`: entidade canônica do contato (chaves: `email_key`, `phone_key`, `nome_key`) — clusterizada por regras determinísticas + score.
  - `fct_lead` / `fct_venda`: granularidade fato, FK para `dim_pessoa.pessoa_id`.
  - `bridge_lead_venda`: relação N-N com `match_method`, `match_score`, `match_lag_days`, `is_pre_sale` (lead antes da venda — única forma válida de atribuição).
- **MARTS**: views finais para o front (mantém nomes existentes — `vendas_atribuidas` reescrita sobre o core).

## 3. Regras de matching (precisão > recall)

Pipeline determinístico em ordem de força, **somente leads anteriores ou ≤ 90 dias após** (configurável):

1. `email_key` (lower+trim, valida regex RFC simplificado)
2. `phone_key` (últimos 10 dígitos, exige ≥ 10 dígitos válidos, descarta repetidos tipo `9999999999`)
3. `nome_key + cidade` (slug do nome sem acento, exige nome com ≥ 2 tokens)
4. Fallback `nome_key + estado` apenas se score ≥ 0.85

Cada match grava: `match_method`, `match_score` (0–1), `match_lag_days`, `lead_data`, `venda_data`, `auditor_note`.

Vendas sem match em nenhuma camada → `tipo_atribuicao='Sem Atribuição'`.
Vendas com `utm_source` mas sem lead casado → `tipo_atribuicao='UTM Direta (sem lead)'` (novo — separado de "Sem Atribuição" para honestidade analítica).

## 4. Camada de Qualidade de Dados (DQ)

Tabela `dq_findings(entity, entity_id, rule, severity, details, batch_id, created_at)` populada por funções por regra:

- emails inválidos / domínios suspeitos
- telefones < 10 dígitos / repetidos
- duplicidade suspeita (`nome+valor+data±3d` com ids diferentes)
- vendas com `data_matricula` futura ou < 2020
- leads com data depois da venda (no contexto de matching)
- `valor_convertido` ≤ 0 ou > 3σ da turma
- `id_venda` ausente ou colidindo entre batches

UI: nova rota **/auditoria** com:
- Resumo por severidade
- Drill-down por regra → linhas afetadas
- Botão "marcar como revisado" (grava `dq_resolutions`)

## 5. Reconciliação entre fontes

Nova rota **/reconciliacao** comparando:

- RD Vendas vs Planilha Vendas (quando reativada)
- Total receita por turma vs `edicoes.valor_aprovado`
- Vendas com canal "Meta" vs `meta_ads_spend.conversions` (quando dados existirem)
- Leads RD vs Leads Planilha (overlap, gaps, conflitos de UTM no mesmo email)

Saída: tabela `reconciliacao_fontes` com `gap_count`, `gap_value`, `direction` (faltando_em_a / faltando_em_b / divergente).

## 6. Backend: server functions tipadas (não mais agregação no client)

Substituir `.from('vendas_atribuidas').select(...).limit(20000)` por RPCs em `src/server/analytics.functions.ts`:

- `getKpis(filters)` → totais, com/sem atribuição, ticket médio, % match por método
- `getCanais(filters)`, `getTurmas(filters)`, `getOrigem(filters)`, `getGeo(filters)`, `getProprietarios(filters)`, `getUtms(filters)`, `getPacotes(filters)`
- `getVendasPaginated(filters, page, sort)` — paginação real
- `getDqSummary()`, `getDqByRule(rule)`, `getReconciliacao()`
- `getAuditTrail(venda_id)` — devolve raw original + match + DQ flags

Toda agregação roda em SQL (funções `SECURITY DEFINER` com `search_path=public`), garantindo que **toda página vê o mesmo número** (hoje não vê).

## 7. Limpeza & RLS

- Habilitar RLS nas tabelas órfãs (`jornada_normalizada`, `meta_ads_spend`, `google_ads_spend`, `sem_atribuicao`) ou removê-las.
- Drop de `planilha_vendas` (duplica `rd_vendas`) ou converter em RAW de outra fonte.
- `sem_atribuicao` deixa de ser tabela física — vira view sobre `fct_venda` filtrando `tipo_atribuicao='Sem Atribuição'`.

## 8. UI reformulada

Novas/renomeadas rotas (sidebar reorganizada em 3 grupos):

**Análise**
- `/` Visão geral (KPIs unificados + alerta se DQ severa)
- `/canais`, `/turmas`, `/origem`, `/utms`, `/geografia`, `/pacotes`, `/proprietarios` (consumindo RPCs)
- `/vendas` — tabela paginada com badge de `match_method`, score e link "auditar"

**Auditoria**
- `/auditoria` — resumo DQ
- `/auditoria/regra/$regra` — detalhe
- `/auditoria/venda/$id` — trilha completa (RAW → staging → match → DQ)
- `/reconciliacao` — gaps entre fontes

**Admin**
- `/admin/import` — adiciona seleção de fonte, preview de DQ antes de promover RAW→STG, histórico de batches com diff
- `/admin/regras-match` — tunar prioridade/threshold
- `/admin/qualidade` — habilitar/desabilitar regras DQ

## 9. Migrações SQL (alto nível)

1. Criar funções `norm_nome`, `is_valid_email`, `is_valid_phone`.
2. Criar `dim_pessoa`, `fct_venda`, `fct_lead`, `bridge_lead_venda`, `dq_findings`, `dq_resolutions`, `reconciliacao_fontes`.
3. Procedure `rebuild_core(batch_id uuid)` que: faz staging, popula dim/fct, executa matching, grava DQ. Idempotente por batch.
4. Reescrever `vendas_atribuidas` sobre o core (mantém contrato pra UI atual).
5. RLS authenticated-read em tudo no `public`; admin-write.
6. Habilitar `pg_cron` (se disponível) p/ rodar `rebuild_core` após cada import.

## 10. Plano de execução (sequência)

1. **Fundação SQL**: migrations 1-3 acima + `rebuild_core` rodando uma vez sobre dados atuais.
2. **Reescrever `vendas_atribuidas`** sobre o core, com regra "lead anterior à venda".
3. **RPCs analíticas** + refatorar todas as rotas analíticas para consumi-las.
4. **Página /auditoria** com DQ completo.
5. **Página /reconciliacao** + reativar `meta_ads_spend` / `google_ads_spend` no import.
6. **Refatorar /admin/import**: RAW + preview DQ + histórico/diff de batches.
7. Limpeza: RLS nas órfãs, drop `planilha_vendas`, `sem_atribuicao` vira view.
8. Reimportar `rd_leads` (orientar usuário) e validar reconciliação.

## Detalhes técnicos chave

- **Matching só conta lead anterior à venda** (`lead.data_criacao <= venda.data_matricula + INTERVAL '1 day'`) — corrige P1.
- **Hierarquia honesta de atribuição**: `Lead Anterior` (forte) > `Lead Posterior <90d` (fraco, marcado) > `UTM Direta` (sem lead) > `Sem Atribuição`.
- **Match score**: 1.0 (email) > 0.9 (telefone) > 0.75 (nome+cidade) > 0.6 (nome+estado). Threshold mínimo configurável.
- **`fct_venda` carrega `valor_convertido_brl`** pré-convertido (hoje vem do RD), e mantém `valor` original + moeda — auditável.
- **Toda rota analítica retorna `as_of` (timestamp do último rebuild)** exibido no header — usuário sempre sabe a versão dos dados.
- **`audit_trail` por venda** mostra: RAW JSON, regras DQ acionadas, qual lead casou, qual foi o método, score, lag em dias.

## Fora deste escopo (próximos)

- Fuzzy matching ML-based (Levenshtein/Jaro) — só se determinístico + nome+cidade não cobrir.
- Materialização incremental (hoje rebuild é full — ok até ~100k linhas).
- Conector direto com API RD Station (substitui CSV).

