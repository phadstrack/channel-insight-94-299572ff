## Objetivo

Substituir o código atual (framework "arc3 audit", desconectado do banco) por um app coerente com o schema real: vendas, leads, atribuição por canal, workspaces, importação e administração.

## Escopo desta entrega

Vou entregar em **duas grandes fases**. Esta primeira fase deixa o app navegável, sem TS errors, com as páginas centrais já alimentadas pelo banco real. A segunda fase adiciona refinamentos (regras dinâmicas de canal, BI workspaces, tutoriais).

### Fase 1 — Base funcional (esta entrega)

**Limpeza**
- Remover `src/arc3/**` inteiro (código morto, sem uso pelo UI).
- Reescrever `src/lib/auth-context.tsx` para usar `user_roles` + `profiles` (admin vs user) em vez de `arc3_clients`/`arc3_client_members`.
- Reescrever `Sidebar` com a navegação real.
- Reescrever `src/routes/index.tsx` (Visão Geral com KPIs de vendas).
- Apagar `src/routes/workspace.tsx`, `src/routes/auditoria.$id.tsx`, `src/routes/conta.tsx` antigos e recriar conforme novo modelo.

**Páginas novas (route files em `src/routes/`)**
1. `index.tsx` → **Visão Geral**: KPIs (receita total, vendas, leads, conversão lead→venda) + série temporal mensal + breakdown por canal. Usa `vendas_atribuidas`, `fct_lead`, `bridge_lead_venda`.
2. `vendas.tsx` → tabela paginada + filtros (período, turma, estado, canal, busca). Usa `get_vendas_agg` e `vendas_atribuidas`.
3. `leads.tsx` → tabela de `fct_lead` + KPIs (total leads, únicos por pessoa, CPL placeholder, taxa de conversão via `bridge_lead_venda`).
4. `canais.tsx` → breakdown via `get_canais_breakdown` (gráfico + tabela).
5. `geografia.tsx` → mapa simples por estado/cidade.
6. `admin.cadastros.tsx` → tabs para **Produtos**, **Edições**, **Contas**, **Orçamentos**, **Regras de classificação** (CRUD direto nas tabelas `produtos`, `edicoes`, `contas`, `orcamentos`, `regras_classificacao`).
7. `admin.import.tsx` → disparar `rebuild_core()` + listar `planilha_imports`.
8. `auditoria.tsx` → listar `dq_findings` (problemas de qualidade de dados).
9. `conta.tsx` → editar `profiles` do usuário logado.
10. `login.tsx` → manter (já funciona).

**Componentes compartilhados**
- `PageHeader` (sem `tutorialKey` por enquanto — fase 2).
- `KpiCard` (já existe, manter).
- `GlobalFilters` (período + turma + estado + canal).

**Auth/Roles**
- Admin = `has_role('admin')` via tabela `user_roles`. Cliente = qualquer outro role.
- Admin vê todas as páginas; usuário comum vê só Visão Geral + Vendas + Leads (read-only).

### Fora desta fase (fase 2, depois que você aprovar a base)
- Tutoriais com driver.js (precisa re-instalar e re-mapear os data-tour).
- Cadastro dinâmico de **Canais** com `regras_canal` + função `derive_canal_dinamico` (atual `derive_canal_v2` continua sendo a fonte para `vendas_atribuidas`).
- BI Workspaces (`/app/workspaces`, modelo de dados, query builder).
- Página Turmas, UTMs, Campanhas.

## Detalhes técnicos

- Rotas: file-based em `src/routes/` (flat com pontos: `admin.cadastros.tsx`).
- Queries: `supabase` client direto via `useQuery` (TanStack Query) — sem `createServerFn` por enquanto, igual ao padrão atual.
- TS: nenhum cast/`as any`; tipos vêm do `types.ts` gerado.
- Sem novas migrations nesta fase (o schema já tem tudo).
- Sem alterações em estilos globais; usar tokens existentes em `src/styles.css`.

## Critério de pronto da Fase 1
- `bun run build` sem erros TS.
- Todas as rotas no Sidebar abrem sem 404.
- Visão Geral mostra dados reais de `vendas_atribuidas`.
- Cadastros permite CRUD nas 5 entidades.

Depois que aprovar, executo tudo de uma vez.