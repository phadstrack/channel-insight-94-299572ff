# Atribuição de Vendas ↔ Leads

## Diagnóstico

Estado atual no banco:

| Tabela | Linhas | Observação |
|---|---|---|
| `rd_vendas` | 3.977 | 3.897 com email, 2.303 com telefone |
| `rd_leads` | **0** | última importação (133k) parece ter sido limpa |
| `planilha_leads` | 12.000 | tem `email` + `telefone` (sem nome/data) |

A view `vendas_atribuidas` hoje só faz `LEFT JOIN rd_leads ON lower(email)`. Com `rd_leads` vazia, toda venda cai em "Sem Atribuição" — por isso o canal não aparece em /canais.

## Estratégia em 2 passos

**Passo 1 — Match por email (forte):**
para cada venda, normalizar `lower(trim(email))` e procurar lead com mesmo email em `rd_leads` ∪ `planilha_leads`. Se achar → `tipo_match = 'email'`.

**Passo 2 — Fallback por telefone (apenas para vendas que ficaram sem match):**
normalizar telefone para apenas dígitos e usar os **últimos 10 dígitos** (ignora DDI 55 e 9º dígito quando ausente em um dos lados). Match → `tipo_match = 'telefone'`.

Sem match → `tipo_match = 'sem'`.

## Mudanças

### 1. Migração SQL

- Função imutável `public.norm_email(text)` → `lower(trim(...))`.
- Função imutável `public.norm_phone(text)` → `regexp_replace(...,'\D','','g')` truncado aos últimos 10 dígitos.
- Índices:
  - `rd_leads(norm_email(email))`, `rd_leads(norm_phone(telefone))`
  - `planilha_leads(norm_email(email))`, `planilha_leads(norm_phone(telefone))`
  - `rd_vendas(norm_email(email))`, `rd_vendas(norm_phone(telefone))`
- Substituir a view `vendas_atribuidas` por uma versão que:
  1. Faz `UNION ALL` de `rd_leads` + `planilha_leads` em uma CTE `leads_all` (campos comuns: email, telefone, utm_*, canal, origem_lead, data).
  2. CTE `match_email`: `DISTINCT ON (norm_email)` mais recente por email.
  3. CTE `match_phone`: `DISTINCT ON (norm_phone)` mais recente por telefone, **excluindo emails já presentes em match_email** (para não duplicar).
  4. `LEFT JOIN` venda → match_email; `LEFT JOIN` venda → match_phone quando email não casou.
  5. Nova coluna `tipo_match` (`email` | `telefone` | `sem`) e `tipo_atribuicao` ajustado:
     - `Existente` se venda já tinha `utm_source`,
     - `Inferida` se veio do match (email ou telefone),
     - `Sem Atribuicao` caso contrário.

### 2. UI

- Em `/canais` (e KPIs gerais) o canal passa a ser preenchido pelo lead casado, sem mudança de código no front — a view continua expondo `canal`.
- Adicionar pequeno badge na tabela de Vendas mostrando `tipo_match` (email/telefone/—) para auditoria. Arquivo: `src/routes/vendas.tsx`.

## Detalhes técnicos

```sql
CREATE OR REPLACE FUNCTION public.norm_phone(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(RIGHT(regexp_replace(coalesce(p,''), '\D','','g'), 10), '')
$$;
```

Match por telefone exige ≥ 10 dígitos para evitar falsos positivos.

A view vira `SECURITY INVOKER` padrão (sem mudança de RLS — leitura permitida a authenticated em todas as tabelas envolvidas).

## Fora deste escopo (próximos passos sugeridos)

- Reimportar `rd_leads` (a tabela está vazia — a view ganha muito mais matches quando ela voltar a ter os 133k registros).
- Match por nome+telefone parcial (fuzzy) — só se o telefone puro deixar muitas vendas sem atribuição.
- Persistir resultado em tabela materializada se a view ficar lenta (>1s).
