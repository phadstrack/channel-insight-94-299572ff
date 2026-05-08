# Explorador visual de tabelas com junções (sem SQL)

Transformar a aba **Modelo** em um explorador clicável estilo "Power BI light":
clico numa tabela → vejo todas as linhas; adiciono junções por clique → trago colunas e contagens da outra tabela; filtro por qualquer coluna (incluindo as trazidas da junção); exporto.

Sem digitar SQL. Toda a execução é no banco (Postgres) via uma RPC genérica e segura — escala para qualquer volume.

## 1. Como o usuário usa (fluxo)

1. Na aba **Modelo**, clico em **fct_venda** → abre uma grade (drawer/tela cheia) com **todas as colunas** da tabela, paginada, ordenável, com busca por coluna.
2. No topo da grade há um botão **"+ Conectar tabela"**:
   - Escolho a tabela alvo (ex.: `fct_lead`).
   - Escolho a chave de junção (ex.: `email_key = email_key`, ou `phone_key = phone_key`, ou as duas com OR).
   - Escolho o que trazer:
     - **Contagens**: nº de leads, nº de leads distintos por dia, etc.
     - **Colunas agregadas**: `utm_source` do primeiro lead, `utm_source` do último lead, lista única de `utm_source`, idem para `utm_medium`, `utm_campaign`, `utm_content`, `origem_lead`.
     - **Datas**: primeira `data_lead`, última `data_lead`.
3. Cada coluna trazida vira uma **coluna nova na grade de Vendas**, com o nome amigável (ex.: `leads.qtd_cadastros`, `leads.utm_source_ultimo`, `leads.utm_source_lista`).
4. Posso adicionar **mais conexões** na mesma venda (ex.: também ligar `fct_venda → bridge_lead_venda` para trazer `match_method`, ou `fct_venda → dim_pessoa` para trazer cidade/estado normalizados).
5. Posso **filtrar por qualquer coluna** — inclusive as agregadas: "só vendas com `leads.qtd_cadastros >= 2`", "vendas com `leads.utm_source_lista` contendo `fb`", "vendas sem lead".
6. Botão **Exportar CSV** com a visão atual.
7. Botão **Salvar visão** (localStorage): guarda a base, junções, filtros e ordem das colunas com um nome ("Vendas com 2+ cadastros e UTM Meta") — fica acessível na sidebar do explorador.

Tudo funciona para **qualquer tabela base** do whitelist (`fct_venda`, `fct_lead`, `bridge_lead_venda`, `dim_pessoa`, `vendas_atribuidas`, `rd_vendas`, `rd_leads`, `planilha_vendas`, `planilha_leads`). E qualquer tabela pode ser conectada a qualquer outra desde que você indique a chave.

## 2. Como funciona por baixo (sem SQL para o usuário)

A interface monta uma "consulta visual" como um JSON:

```text
{
  base: "fct_venda",
  joins: [
    { table: "fct_lead", on: [["email_key","email_key"], ["phone_key","phone_key"]],
      bring: [
        { kind: "count", as: "qtd_cadastros" },
        { kind: "first", col: "utm_source", order_by: "data_lead asc",  as: "utm_source_primeiro" },
        { kind: "last",  col: "utm_source", order_by: "data_lead desc", as: "utm_source_ultimo" },
        { kind: "list_distinct", col: "utm_source",   as: "utm_source_lista" },
        { kind: "list_distinct", col: "utm_campaign", as: "utm_campaign_lista" },
        { kind: "min",   col: "data_lead", as: "data_primeiro_lead" },
        { kind: "max",   col: "data_lead", as: "data_ultimo_lead" }
      ]
    }
  ],
  filters: [{ col: "leads.qtd_cadastros", op: ">=", val: 2 }],
  order_by: [{ col: "data_matricula", dir: "desc" }],
  limit: 200, offset: 0
}
```

O frontend nunca escreve SQL. Esse JSON é enviado a uma RPC `query_builder(p_query jsonb)` que o traduz com segurança em uma única consulta `SELECT base.* + LEFT JOIN LATERAL (SELECT agregações FROM tabela_alvo WHERE join_keys) AS j_N ON true` — usando agregações como `count(*)`, `array_agg(distinct ...)`, `(array_agg(... ORDER BY ...))[1]`.

**Por que LATERAL e não JOIN normal**: Vendas tem 1 linha mesmo que tenha 5 leads. O LATERAL agrega antes de juntar, então a grade não duplica linhas.

## 3. Backend: 1 migração

Criar duas RPCs `SECURITY DEFINER` no Postgres (admin-only, mesma proteção da `exec_read_sql`):

- **`query_builder_meta()`**: devolve o whitelist de tabelas + colunas + tipos + chaves sugeridas. A UI usa para popular os menus de tabela/coluna/chave.
- **`query_builder(p_query jsonb)`**: valida o JSON contra o whitelist (impede injeção — toda referência de tabela/coluna passa por `quote_ident` e tem que estar no whitelist), monta o SELECT com LATERAL joins, executa com `LIMIT` máximo de 5.000 e devolve `{ rows, total_count }`.

Operadores de filtro suportados: `=`, `<>`, `>`, `>=`, `<`, `<=`, `IN`, `BETWEEN`, `IS NULL`, `IS NOT NULL`, `ILIKE %x%`, `array contains`. Agregações suportadas: `count`, `count_distinct`, `min`, `max`, `sum`, `avg`, `first` (primeiro por ordem), `last` (último), `list_distinct` (array_agg distinct, vira `"a, b, c"`).

Whitelist inicial de tabelas/colunas é o conjunto que você já vê na aba Modelo. Adicionar uma tabela nova depois = 1 linha no whitelist da RPC.

## 4. Frontend: nova aba "Explorar" em `/modelo`

Adicionar uma terceira aba ao lado de **Modelo** e **Consulta SQL**:

```text
┌─ Explorar ───────────────────────────────────────────────────────┐
│ Tabela base: [ fct_venda ▾ ]   Visões salvas: [ Padrão ▾ ] [+]   │
│                                                                  │
│ Conexões:  [ + Conectar tabela ]                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ → fct_lead   por email_key OR phone_key             [✏][✕] │ │
│  │   trazer: qtd_cadastros, utm_source_ultimo, utm_source_..  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Filtros:  [ + Filtro ]   leads.qtd_cadastros ≥ 2  [✕]            │
│ Ordenar: data_matricula ↓                                        │
│                                                                  │
│ [Executar]  [Exportar CSV]  [Salvar visão]   1.247 linhas        │
│ ┌─ Grade ─────────────────────────────────────────────────────┐  │
│ │ data_matricula │ nome │ valor │ leads.qtd │ leads.utm_src…  │  │
│ │ ...                                                          │  │
│ └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

E o **clique numa tabela do esquema** (na aba Modelo) abre o Explorador já pré-carregado com aquela tabela como base.

Componentes:
- `ExplorerView.tsx` — orquestra estado (JSON da query + visões salvas em localStorage por nome).
- `ConnectionEditor.tsx` — modal com 3 passos: tabela alvo → chaves → colunas/agregações a trazer.
- `FilterRow.tsx` — coluna (com search), operador, valor (input adapta a tipo).
- `ResultGrid.tsx` — tabela paginada com headers ordenáveis, sticky, busca por coluna.
- `lib/explorer-runner.ts` — chama a RPC `query_builder` e devolve `{ rows, total }`.

## 5. Sobre "qualquer informação de qualquer tela"

Para cumprir "puxar dados de qualquer tela": as outras telas (Vendas, Origem, Canais, Auditoria, etc.) ganham um botão pequeno **"Abrir no Explorador"** no topo. Ele monta o JSON correspondente àquela visão (mesma tabela base, mesmos filtros vindos do `useFilters`) e abre `/modelo` aba Explorar — você continua dali, conectando o que quiser.

## Entregáveis

- `supabase/migrations/<ts>_query_builder.sql`
  - `query_builder_meta()` e `query_builder(jsonb)` com whitelist e validação.
- `src/routes/modelo.tsx`
  - Nova aba **Explorar** + clique nas tabelas do esquema abre o Explorador.
- `src/components/explorer/ExplorerView.tsx`, `ConnectionEditor.tsx`, `FilterRow.tsx`, `ResultGrid.tsx`
- `src/lib/explorer-runner.ts`
- Botão "Abrir no Explorador" em `vendas.tsx`, `origem.tsx`, `canais.tsx`.

## Não-entregáveis (fora do escopo desta rodada)

- Gráficos/agregações visuais (pivot, charts) — Explorador entrega tabela; gráficos podem vir numa próxima.
- Edição de dados pelo Explorador — só leitura.
