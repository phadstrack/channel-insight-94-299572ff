
# Plano de execução — Produto BI SaaS (Iteração 1: Canvas de Modelagem)

Você escolheu **construir produto SaaS multi-cliente do zero** com prioridade no **canvas visual de modelagem com chave composta**. Vou seguir a estratégia iterativa da Parte 2 do seu documento, mas começando pelo Módulo 4 (canvas) — porque é o diferencial e o que valida o produto inteiro.

**Importante**: o painel Febracis atual (rotas `/`, `/vendas`, `/origem`, `/canais`, etc.) **fica intocado**. Tudo novo vive sob `/app/*` como produto paralelo. Quando o produto novo amadurecer, decidimos se o Febracis migra pra ele ou continua separado.

## Escopo desta iteração (1 entrega)

```text
┌─ /app/workspaces ──────────────────────────────────────────────┐
│ Workspace = "tenant" do usuário. Cada um isola seus dados.    │
│ Ex.: "Febracis", "Cliente X", "Sandbox"                        │
└────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─ /app/w/:id/sources ───────────────────────────────────────────┐
│ Importação MÍNIMA: upload XLSX/CSV → SheetJS → Postgres       │
│ Cada planilha vira linhas em ds_rows (JSONB) + metadata em    │
│ ds_sources e ds_columns. SEM tabela física por usuário (não   │
│ escala em multi-tenant).                                       │
└────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─ /app/w/:id/model ─── ★ FOCO PRINCIPAL ★ ─────────────────────┐
│ Canvas React Flow:                                             │
│  • Cada source = card arrastável com lista de colunas         │
│  • Arrastar coluna→coluna cria relacionamento                 │
│  • Botão "Chave composta" abre modal multi-coluna             │
│  • Validação de match: % cobertura + órfãos em cada lado      │
│  • Cardinalidade detectada (1:1, 1:N, N:N)                    │
│  • Ativar/desativar, editar, remover                          │
└────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─ /app/w/:id/explore ───────────────────────────────────────────┐
│ Reaproveita query_builder atual, adaptado pra ler ds_rows.    │
│ Permite testar o modelo: "vendas + leads.qtd_cadastros"       │
└────────────────────────────────────────────────────────────────┘
```

NÃO entra nesta iteração: limpeza tipo Power Query (Módulo 3), medidas DAX (5), construtor de painéis (6), tutorial joyride (7), dados de exemplo, link público, exportação PDF. Cada um é uma iteração futura.

## 1. Banco (1 migração)

Multi-tenant via `workspace_id` em todas as tabelas + RLS.

```text
workspaces           (id, owner_id, name)
workspace_members    (workspace_id, user_id, role)   -- futuro
ds_sources           (id, workspace_id, name, row_count, created_at)
ds_columns           (id, source_id, name, type, ordinal)
ds_rows              (id, source_id, data jsonb)     -- 1 linha = 1 registro
data_models          (id, workspace_id, name)
model_nodes          (id, model_id, source_id, x, y) -- posição no canvas
relationships        (id, model_id, from_source, to_source, cardinality, direction, active)
relationship_columns (relationship_id, from_col, to_col, ord) -- N linhas = chave composta
```

RLS: `workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())` em tudo. Criação de workspace sempre adiciona o owner como `admin` em `workspace_members`.

RPCs:
- `import_sheet(workspace_id, name, columns jsonb, rows jsonb)` — cria source + columns + insere rows.
- `validate_relationship(model_id, from_source, to_source, col_pairs jsonb)` — devolve `{matched_left, total_left, matched_right, total_right, cardinality}`. É o coração da "validação de match" do Módulo 4. Funciona pra chave simples e composta (concatena com `||'|'||`).
- `model_query(model_id, base_source, joins jsonb, ...)` — generaliza o `query_builder` atual pra usar `ds_rows` + relacionamentos do modelo.

## 2. Frontend

Pacotes a adicionar: `reactflow`, `xlsx`, `dnd-kit/core`, `zustand`.

Rotas (TanStack):
- `src/routes/_app/workspaces.tsx` — lista + criar workspace
- `src/routes/_app/w.$wid.sources.tsx` — importação + listagem
- `src/routes/_app/w.$wid.model.tsx` — **canvas React Flow** (peça central)
- `src/routes/_app/w.$wid.explore.tsx` — explorador adaptado

Componentes novos:
- `model/ModelCanvas.tsx` — React Flow + nodes customizados + edges com cardinalidade
- `model/SourceNode.tsx` — card de tabela arrastável, lista colunas, drag handle por coluna
- `model/RelationshipModal.tsx` — confirma cardinalidade, direção, mostra match%
- `model/CompositeKeyEditor.tsx` — UI multi-coluna pra chave composta (3 etapas: lado A, lado B, validar)
- `model/MatchValidation.tsx` — gauge de cobertura + lista de exemplos órfãos
- `sources/ImportWizard.tsx` — SheetJS, preview 50 linhas, escolher abas, editar tipos
- `lib/model-store.ts` — Zustand pra estado do canvas (nodes, edges, selecionado)

## 3. Por que essa ordem (e não a do seu documento)

Seu documento sugere: Auth → Sources → Cleaning → Model → Measures → Dashboards → Tutorial.

Mudo pra: **Workspaces → Sources mínimo → Model (canvas) → Explore**, adiando cleaning, measures, dashboards, tutorial.

Razão: o canvas é o que prova o produto. Se o canvas+chave composta+validação de match funciona bem, o resto vira preenchimento. Se não funciona, nenhum dashboard salva. E hoje, sem o canvas, você já tem como explorar dados pelo Explorador atual — então cleaning/measures não bloqueiam.

## 4. Iterações seguintes (não nesta entrega)

- **It. 2**: Cleaning UI empilhável (Módulo 3) — operações como `cleaning_steps` aplicados sobre `ds_rows` em uma view materializada por source.
- **It. 3**: Medidas (Módulo 5) — começar com SUM/COUNT/DISTINCTCOUNT/IF/LOOKUP. CALCULATE fica pra depois.
- **It. 4**: Dashboards (Módulo 6) — `react-grid-layout`, KPI + Tabela + Barras, cross-filter via Zustand.
- **It. 5**: Restante dos visuais + slicers + filtros hierárquicos.
- **It. 6**: Onboarding + react-joyride + dados de exemplo + Centro de Ajuda.
- **It. 7**: Polimento, link público, export PDF, multi-página, multi-membro de workspace.

## 5. Riscos e mitigações

- **`ds_rows` JSONB pode ficar lento** com milhões de linhas. Mitigação: índice GIN em `data`, paginação obrigatória no Explore. Se virar gargalo, criamos materialização por source na It. 2.
- **React Flow + muitas tabelas/colunas** trava. Mitigação: virtualizar lista de colunas dentro do node se >50; collapse por padrão.
- **Validação de match pode ser cara** em sources grandes. Mitigação: limitar a 100k linhas por lado na validação inicial; mostrar amostra de órfãos, não lista completa.
- **Coexistência com painel Febracis**: zero impacto. Tabelas novas têm prefixo (`ds_*`, `model_*`), rotas sob `/app/*`, sidebar do Febracis ganha só um link "Produto BI (beta)".

## Entregáveis desta iteração

- 1 migração SQL: tabelas + RLS + RPCs (`import_sheet`, `validate_relationship`, `model_query`)
- 4 rotas novas sob `/_app/`
- ~10 componentes novos
- Sidebar com link "BI (beta)" levando a `/app/workspaces`
- README curto explicando o que é o produto novo vs painel Febracis

Estimativa: 2-3 dias de implementação intensa só pra esta iteração. Aprovando, eu começo pela migração e pelo canvas (que é o que você quer ver primeiro).
