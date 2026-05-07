# Auditoria 360 — Achados e plano de correção

Análise feita assumindo as 5 lentes pedidas (CMO, Eng. dados, Cientista, Analista, Dashboard builder). Vou do bug que você reportou e expando para os problemas estruturais que esse bug expõe.

---

## 1. Por que "Todos" em /canais não mostra o valor total

**Causa raiz (analista + dashboard builder):** o card "Receita" mostra a soma do canal selecionado. Quando você clica **Todos**, o filtro `canal` deixa de ser aplicado e a query devolve as 3.977 vendas — mas o componente continua usando `channelColor("Todos")`, que cai no fallback cinza, e o KPI **% do Total** vira sempre 100%, dando a impressão visual de que "não tem nada novo". Além disso:

- O label do KPI é genérico ("Receita") e não diferencia "receita do canal" de "receita total".
- Não existe nenhum KPI/linha mostrando a comparação canal vs. total no mesmo card.
- A query `.limit(10000)` é silenciosa: se o universo crescer, "Todos" passa a truncar sem aviso.
- O segundo `useQuery` (`canais-total`) que serviria de denominador **não é exibido** em nenhum lugar quando `canal = Todos`.

Hoje a base tem **R$ 20.677.299,72** em 3.977 vendas — esse número precisa aparecer como "Receita Total" sempre que "Todos" estiver ativo.

## 2. Outros problemas estruturais encontrados

### Engenheiro de dados / Cientista
- `vendas_atribuidas` recalcula `derive_canal()` em cada SELECT (view sem materialização). Em filtros pesados isso degrada perceptivelmente.
- `tipo_atribuicao` ainda usa `v.utm_source` cru, em vez do COALESCE com lead — vendas com UTM só no lead caem em "Sem Atribuição" indevidamente.
- `rebuild_core` não popula `dim_pessoa.email/telefone/nome` quando a chave é só `nk` ou `pk` (perde rastreabilidade humana).
- Não há índices em `fct_venda(data_matricula, canal)`, `fct_lead(email_key, phone_key)` — consultas filtradas escaneiam tudo.

### CMO / Analista
- `GlobalFilters.tsx` ainda lista canais legados hard-coded (`Meta/Instagram`, `Lead Trafego`, `Sem UTM`, `Sem Lead`). Filtro de Canal **nunca casa** com a taxonomia atual (Mídia/CRM/YouTube/Redes/Orgânicos/Outros/Sem Atribuição).
- `index.tsx` ainda usa `tipoMap["Existente"]` e label "Existente" (taxonomia antiga), então KPI "Canal Identificado" mostra **0%** sempre.
- `index.tsx` agrupa fallback em `"Sem Lead"` (legado) em vez de `"Sem Atribuição"`.
- `format.ts` mantém badges legados (`Existente`, `Inferida`, `Sem Atribuicao`) misturados com a nova taxonomia — confunde manutenção.

### Dashboard builder
- `/canais` no estado "Todos": sem KPI comparativo, sem chart de share por canal, sem ranking de canais.
- Tendência mensal usa cor do canal selecionado mesmo em "Todos" (vira cinza).
- Sem indicador de período coberto (min/max de `data_matricula`) — usuário não sabe se filtro de data está cortando.
- `.limit(10000)` em todas as páginas sem feedback "exibindo X de Y".

---

## 3. Plano de correção (executado em modo build após aprovação)

### A. /canais — corrigir o "Todos" + enriquecer
1. Quando `canal === "Todos"`:
   - KPIs viram **Receita Total / Vendas Totais / Ticket Médio Geral / # de canais ativos**.
   - Adicionar **gráfico de barras horizontais** (share de receita por canal) e **tabela ranking** com vendas, receita, ticket, %.
   - Linha mensal colorida por canal (multi-line) em vez de única cinza.
2. Quando canal específico: manter layout atual + nova linha "vs. total" no card de Receita (`R$ X · Y% do total`).
3. Substituir `.limit(10000)` por agregação server-side via nova RPC `get_canais_breakdown(filtros)` (retorna por canal + total) — performance e correção em uma só.

### B. Filtros globais — alinhar com taxonomia atual
4. `GlobalFilters.tsx`: trocar lista hard-coded por `CANAIS_LIST` de `format.ts`.
5. Carregar `turmas`/`estados` via RPC distinta agregada (não via `.limit(3000)` que pode perder valores).

### C. Visão Geral (/) — remover legado
6. Trocar `tipoMap["Existente"]` por soma de `Lead Anterior + Lead Posterior + UTM Direta` para o KPI "Canal Identificado".
7. Trocar fallback `"Sem Lead"` por `"Sem Atribuição"`.
8. Remover badges/labels `Existente`/`Inferida` de `format.ts` e da UI.

### D. Camada de dados (migration)
9. Atualizar `vendas_atribuidas`: `tipo_atribuicao` deve usar `COALESCE(v.utm_source, l.utm_source)` para classificar "UTM Direta".
10. Criar índices: `fct_venda(data_matricula)`, `fct_venda(canal_venda)`, `fct_lead(email_key)`, `fct_lead(phone_key)`, `bridge_lead_venda(venda_id) WHERE is_primary`.
11. Criar RPC `get_canais_breakdown(p_date_from, p_date_to, p_turmas, p_estados)` retornando `(canal, vendas, receita, ticket)` + linha total — usada por /canais e Overview.
12. (Opcional, recomendado) materializar `vendas_atribuidas` como `MATERIALIZED VIEW` com refresh disparado ao final de `rebuild_core()`.

### E. Higiene
13. Remover constantes/labels legadas (`Meta/Instagram`, `Lead Trafego`, `Sem UTM`, `Existente`, `Inferida`) do código.
14. Adicionar nota no rodapé da tabela "exibindo N de M" quando query for limitada.

---

## 4. Detalhes técnicos (para referência)

```text
Bug "Todos":
  canal=="Todos" → query sem .eq → retorna 3977 linhas (ok)
  KPIs usam channelColor(canal) → fallback cinza
  pct = receita/totalReceita → 100% sempre (denominador = numerador)
  Faltam KPIs apropriados ao contexto "agregado"
```

Arquivos a tocar:
- `src/routes/canais.tsx` (refator de KPIs + ranking + multi-line)
- `src/routes/index.tsx` (tipo_atribuicao, fallback, KPI identificado)
- `src/components/dashboard/GlobalFilters.tsx` (canais)
- `src/lib/format.ts` (limpeza de badges legadas)
- nova migration: `vendas_atribuidas` (UTM direta via coalesce), índices, RPC `get_canais_breakdown`, opcional MV.

Após aprovação eu aplico tudo numa rodada (uma migration + edits de UI), valido com `SELECT` no Supabase comparando totais, e te entrego com print mental de cada KPI conferido.
