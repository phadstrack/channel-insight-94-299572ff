# Nova página: Modelo de Dados (estilo Power BI) + SQL Explorer

Adiciona uma página `/modelo` que reproduz a experiência da imagem enviada — visualizar tabelas, colunas e relacionamentos — combinada com um editor SQL para fazer joins/consultas como no Power BI.

## 1. Rota `/modelo` — duas abas

### Aba "Modelo" (visão de relacionamento)
- Canvas com **cards de tabelas** desenháveis (drag para reposicionar) mostrando nome + lista de colunas com ícone de tipo (texto, número, data).
- **Linhas de relacionamento** entre tabelas (conexão visual estilo PBI):
  - `fct_venda.email_key` ↔ `fct_lead.email_key`
  - `fct_venda.phone_key` ↔ `fct_lead.phone_key`
  - `bridge_lead_venda.venda_id` → `fct_venda.venda_id`
  - `bridge_lead_venda.lead_id` → `fct_lead.lead_id`
  - `fct_venda.pessoa_id` → `dim_pessoa.pessoa_id`
  - `vendas_atribuidas` (view) → mostrada como tabela calculada
- Painel lateral direito ao clicar em uma tabela: amostra de dados (10 linhas via Supabase select), contagem total e descrição.
- Implementação: `react-flow` (`@xyflow/react`) — já lida com nós arrastáveis, edges curvas, minimap e zoom.

### Aba "Consulta" (SQL Explorer)
- Editor de SQL (textarea mono) + botão Executar.
- Painel lateral com a árvore das tabelas/colunas do whitelist (clicar adiciona ao editor).
- Tabela de resultados paginada com:
  - export CSV
  - histórico das últimas 20 queries (localStorage)
  - snippets prontos: "Vendas por última origem", "Leads sem venda 30d", "Gap origem × última origem", "UTMs por canal".
- Backend: server fn `runReadSql` em `src/lib/explorer.functions.ts` que chama RPC `exec_read_sql` (SECURITY DEFINER) já validando SELECT/WITH e bloqueando schemas sensíveis.

## 2. Migração SQL
- `derive_canal_v2(ultima_origem, origem)` — classifica canal pela última origem (UTM não decide).
- View `vendas_atribuidas` recriada com `canal`, `origem_principal`, `origem_secundaria`, `fonte_atribuicao`, e UTMs do lead em colunas `lead_utm_*` para auditoria.
- Função RPC `exec_read_sql(p_sql text)` — admin-only, valida `^(select|with)`, bloqueia DDL/DML, bloqueia `auth.*`, `pg_*`, `user_roles`, `profiles`, força `LIMIT 5000`, retorna jsonb.

## 3. Frontend complementar
- `src/lib/canal.ts` — espelhar a nova lógica (origem decide, UTM ignorada).
- `src/lib/format.ts` — incluir canal "Operacional" na lista com cor própria.
- `src/routes/origem.tsx` — duas tabelas lado a lado (última origem × origem original) com `utm_source` predominante por linha.
- `src/routes/canais.tsx` — linha do detalhamento exibe top-3 origens reais e top-3 UTMs por canal (evidência).
- `src/routes/index.tsx` — KPI "Atribuição Identificada" baseado em `fonte_atribuicao IN ('ultima_origem','origem')`.
- `src/components/dashboard/Sidebar.tsx` — item "Modelo de Dados" apontando para `/modelo`.

## 4. Dependências
- `bun add @xyflow/react` (apenas se ainda não instalado; é leve e compatível com Worker SSR pois roda só no cliente — envolver em dynamic import / `useEffect` se necessário).

## Entregáveis
```text
supabase/migrations/<ts>_attribution_v2_and_explorer.sql
src/lib/explorer.functions.ts
src/lib/canal.ts            (reescrito)
src/lib/format.ts           (CANAIS_LIST + Operacional)
src/routes/modelo.tsx       (nova — abas Modelo/Consulta)
src/routes/origem.tsx       (dual)
src/routes/canais.tsx       (evidência)
src/routes/index.tsx        (KPI)
src/components/dashboard/Sidebar.tsx
```
