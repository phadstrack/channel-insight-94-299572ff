
# Atribuição por Canal (UTM source) + Importador de Planilha

Objetivo: deixar o CMO ver **receita e vendas agrupadas por canal** (derivado da `utm_source`) e, ao clicar num canal, ver as **vendas** atribuídas e os **leads** que contribuíram, considerando o **lead mais recente** do mesmo email/telefone como o ponto de atribuição.

A planilha (2 abas: Leads e Vendas) será sincronizada via **URL pública do Google Sheets** (CSV publicado), sem conector OAuth — você cola o link, o app importa.

---

## 1. Modelo de dados (Supabase)

Duas tabelas novas para não misturar com `vendas_atribuidas` (que mantém o histórico atual):

**`planilha_leads`**
- `id` bigserial, `email`, `telefone`, `nome`, `data_lead` (date), `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `origem_lead` (texto livre), `canal` (derivado), `raw` (jsonb), `imported_at`, `import_batch_id`.

**`planilha_vendas`**
- `id` bigserial, `email`, `telefone`, `nome`, `data_matricula` (date), `valor_convertido` (numeric), `turma`, `estado`, `cidade`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `canal` (derivado), `lead_id` (fk → planilha_leads, atribuição calculada), `lead_data` (date), `dias_lead_para_venda`, `raw` (jsonb), `imported_at`, `import_batch_id`.

**`planilha_imports`** (auditoria): `id`, `sheet_url`, `aba`, `linhas_inseridas`, `status`, `erro`, `created_at`.

RLS: leitura para `authenticated`, escrita só `admin` (mesmo padrão das outras tabelas).

Índices em `email`, `telefone`, `data_lead`, `data_matricula`, `canal`.

---

## 2. Derivação de canal (utm_source → canal)

Função pura `deriveCanal(utm_source, utm_medium, origem_lead)`:

1. Se `utm_source` casar `^mkt[_-](.+)$` → canal = capitalize do grupo (`mkt_meta` → "Meta", `mkt_google` → "Google"). **Padrão novo (≥ 01/05/2026).**
2. Senão, aplicar regras configuráveis (tabela `regras_classificacao` já existe) por substring em `utm_source`/`utm_medium`/`origem_lead`:
   - contém `face|insta|meta|fb` → Meta/Instagram
   - contém `google|gads|adwords` → Google
   - contém `organ|seo` → Orgânico
   - contém `tiktok` → TikTok
   - contém `whats|wpp` → WhatsApp
   - …(seedamos os mais comuns; o admin pode editar)
3. Sem match e com lead → "Outros (com lead)"; sem lead → "Sem Atribuição".

Implementada em `src/lib/canal.ts` (compartilhada entre import e UI) e replicada no SQL para queries agregadas.

---

## 3. Importador via URL pública

Tela nova **`/admin/import`** (gated por role `admin`):

- Input: URL da planilha (ex.: `https://docs.google.com/spreadsheets/d/<ID>/edit`) + dois selects de aba (Leads / Vendas) com seus `gid`.
- Botão "Pré-visualizar" → mostra 10 primeiras linhas + mapeamento automático de colunas (com override manual).
- Botão "Importar" → roda em server function (`createServerFn`) que:
  1. Converte URL em `…/export?format=csv&gid=<gid>` (planilha precisa estar "Qualquer pessoa com link pode visualizar").
  2. `fetch` + parse CSV (papaparse).
  3. Normaliza, deriva `canal`, faz **upsert** por chave natural (`email + data_lead` para leads; `email + data_matricula + valor` para vendas).
  4. Para cada venda, calcula `lead_id` = lead mais recente do mesmo email com `data_lead <= data_matricula`. Se não houver email match, tenta telefone.
  5. Grava batch em `planilha_imports`.
- Histórico dos últimos imports na mesma tela.

Sem conector / sem OAuth. Se depois quiser refresh agendado, dá pra plugar pg_cron numa rota `/api/public/import-planilha` com secret.

---

## 4. Nova visão `/canais-v2` (Atribuição por Canal)

Substitui (ou convive com) `/canais`. Layout:

```text
┌─ Filtros (data, canal, turma) ────────────────────────┐
├─ KPIs: Receita | Vendas | Leads | Taxa Lead→Venda ────┤
├─ Tabela "Canais"                                      │
│   Canal | Leads | Vendas | Receita | Ticket | Conv%   │
│   [linha clicável]                                    │
├─ Drawer ao clicar no canal: ──────────────────────────┤
│   ├─ Aba "Vendas" (lista das vendas do canal)         │
│   └─ Aba "Leads"  (leads que viraram essas vendas +   │
│                    leads sem conversão do período)    │
└───────────────────────────────────────────────────────┘
```

- Fonte: `planilha_vendas` + `planilha_leads` (não mexe em `vendas_atribuidas`).
- Atribuição: **last-touch por lead mais recente** (já materializada via `lead_id` no import).
- Filtro padrão: data ≥ 01/05/2026 (período de UTM confiável). Toggle "Incluir período legado" mostra dados anteriores marcados como "pré-tracking".
- Drill-down via TanStack search params (`?canal=Meta`) pra ser linkável.

Export CSV em cada visão, igual `/utms`.

---

## 5. Plano de entrega (incremental, pra você testar comigo)

1. **Migrações** das 3 tabelas + RLS + índices.
2. **`src/lib/canal.ts`** (deriveCanal) com testes de exemplos reais que você passar.
3. **Tela `/admin/import`** + server functions de fetch CSV e upsert. Você importa as duas abas.
4. Validamos 10–20 linhas de cada aba juntos (mapeamento de colunas, canal derivado).
5. **`/canais-v2`** com KPIs + tabela.
6. Drawer de drill-down (Vendas / Leads).
7. Ajustes finos de regras de canal conforme você for vendo padrões na planilha antiga.

---

## Detalhes técnicos
- Server runtime: `createServerFn` em `src/server/import.functions.ts` + helper server-only em `src/server/sheets.server.ts` (fetch CSV, parse com `papaparse`).
- Cliente Supabase: `requireSupabaseAuth` para checar role admin no servidor antes do upsert; escrita via `supabaseAdmin` (RLS bypass controlado).
- Sem conector Google Sheets (você escolheu URL pública) — não precisa OAuth nem `LOVABLE_API_KEY` extra.
- Roteamento: `src/routes/admin/import.tsx`, `src/routes/canais-v2.tsx`, item novo no `Sidebar.tsx`.

Posso começar pelas migrações + tela de import (passos 1–3) e a gente já testa a ingestão real antes de eu construir a visão. Confirma que faz sentido?
