# Revisão de uso e plano de limpeza

Análise heurística cruzando: links no Sidebar, imports no código, tabelas referenciadas em queries, e contagem real de linhas no banco.

## 1. Rotas / páginas

| Rota | Linhas | Tabela-fonte | Status sugerido |
|---|---|---|---|
| `/` (index) | 322 | `vendas_atribuidas` | **Manter** — home |
| `/vendas` | 438 | `vendas_atribuidas` | **Manter** |
| `/turmas` | 298 | `vendas_atribuidas` | **Manter** |
| `/canais` | 262 | `vendas_atribuidas` | **Manter** |
| `/geografia` | 251 | `vendas_atribuidas` | **Manter** |
| `/utms` | 200 | `vendas_atribuidas` | **Manter** |
| `/pacotes` | 92 | `vendas_atribuidas` | **Consolidar** — vira aba dentro de Vendas |
| `/proprietarios` | 75 | `vendas_atribuidas` | **Consolidar** — idem |
| `/origem` | 76 | `vendas_atribuidas` | **Consolidar** — idem |
| `/modelo` | 511 | `rd_vendas`, `rd_leads`, `jornada_normalizada` + ExplorerView | **Legacy** — sobrepõe ao novo BI canvas |
| `/auditoria` | 247 | `dq_findings`, `bridge_lead_venda` | **Manter** |
| `/admin/import` | 206 | `planilha_imports` | **Manter** |
| `/conta` | 79 | profile | **Manter** |
| `/app/workspaces`, `/app/w/$wid/sources`, `/app/w/$wid/model` | BI beta | **Manter e priorizar** |

**Proposta de menu**: agrupar em duas seções no sidebar ("Resultados" e "Análises"), reduzindo de 14 para ~9 itens visíveis. `/pacotes`, `/proprietarios`, `/origem` viram tabs dentro de `/vendas` ou `/turmas` (rotas continuam vivas, só somem do menu).

## 2. Componentes / código

- `ExplorerView.tsx` (434 linhas) — usado **só** em `/modelo`. Marcar como legacy; remover quando BI Iteração 2 entregar o equivalente.
- `GlobalFilters.tsx` — usado em todas as views. **Manter**.
- `RelationshipModal`, `SourceNode` — em uso pelo BI. **Manter**.
- `lib/filters.tsx` — específico de `vendas_atribuidas`. **Manter** mas planejar versão genérica para BI.

Nada flagrantemente morto fora isso.

## 3. Tabelas no banco

### Em uso ativo (manter)
`vendas_atribuidas` (view), `rd_vendas` (3977), `jornada_normalizada` (3085), `planilha_imports`, `user_roles`, `profiles`, BI (`workspaces`, `ds_*`, `data_models`, `model_nodes`, `relationships*`).

### Com dado, sem código que leia (revisar)
| Tabela | Linhas | Decisão |
|---|---|---|
| `dim_pessoa` | 15520 | Pipeline interno — **manter** se ainda alimenta `vendas_atribuidas` |
| `fct_lead` | 12000 | **Investigar** — duplicado com `planilha_leads`/`rd_leads`? |
| `fct_venda` | 3977 | **Investigar** — duplicado com `rd_vendas` |
| `planilha_leads` | 12000 | Staging — manter se importação ainda usa |
| `bridge_lead_venda` | 16 | Lida em `/auditoria` — **manter** |
| `dq_findings` | 469 | Lida em `/auditoria` — **manter** |
| `sem_atribuicao` | 642 | Não lida em lugar nenhum — **dropar** |
| `produtos`, `contas`, `orcamentos`, `edicoes`, `regras_classificacao` | 2-17 | Cadastros sem UI — **dropar** ou criar UI |

### Vazias + sem código (dropar)
`planilha_vendas`, `rd_leads`, `meta_ads_spend`, `google_ads_spend`, `excecoes`.

## 4. Plano de execução em 3 ondas

**Onda 1 — limpeza segura (sem risco)**
1. Reorganizar Sidebar em seções, esconder Pacotes/Proprietários/Origem do nível raiz.
2. Marcar `/modelo` como "Legacy" no menu até BI canvas substituir.
3. Migration: drop das tabelas vazias-e-órfãs (`planilha_vendas`, `rd_leads`, `meta_ads_spend`, `google_ads_spend`, `excecoes`).

**Onda 2 — limpeza com confirmação**
4. Confirmar se `fct_venda`/`fct_lead` ainda são populadas por algum job. Se não → drop.
5. Drop `sem_atribuicao` (642 linhas, sem leitor).
6. Drop dos cadastros sem UI — **ou** criar tela admin única se for usar.

**Onda 3 — refactor de UI**
7. Transformar `/pacotes`, `/proprietarios`, `/origem` em tabs internas de `/vendas`.
8. Remover `/modelo` + `ExplorerView` quando BI Iteração 2 entregar Explore equivalente.

## Antes de executar a Onda 1, preciso de 2 confirmações

- **fct_venda / fct_lead / dim_pessoa**: ainda têm pipeline alimentando? (Se sim, não toco. Se não, entram na Onda 2.)
- **Cadastros (produtos/contas/orcamentos/edicoes/regras)**: ainda planeja usar, ou estão abandonados?

Posso começar a Onda 1 já — ela não exige essas respostas.
