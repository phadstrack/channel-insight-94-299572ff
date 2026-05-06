## Diagnóstico (planilha real, agora completa)

A planilha tem **2 abas relevantes**:

### Aba 1 — Leads (gid=0) · 133.248 linhas · 23 colunas
Export do RD Station. Funil de leads.
```
Proprietário do lead | Status do lead | Sobrenome (=nome) | Celular | Email |
Unidade RD | UTM Média | UTM Termo | UTM Conteúdo | UTM Campanha |
URL de cadastro | Id do lead | Objeções | UTM Origem |
Cidade ×3 (todas vazias) | Estado ×3 (todas vazias) |
Data e hora de criação | Data de criação | Origem do lead
```
- Status top: `Contato Inicial` 81k, `Não Contactado` 39k, `Desenvolvimento` 5,3k, `Negociação` 2k, `Venda Feita` 488.
- UTM Origem top: `ig` 54k, `mkt_meta_ads` 19k, `Instagram_Reels` 3,3k, `google_search` 1,5k.
- Cidade/Estado **vazias nesta aba** — geografia vem da aba Vendas.

### Aba 2 — Vendas (gid=364416526) · 4.376 linhas · 40 colunas
```
Proprietário da venda | Lead de origem | Curso(2) | Unidade Geradora |
Nome da venda | Fase | Valor Moeda | Valor | Qtd pagantes | Promoção |
Nome do cliente | Celular | Venda pai | Código do Curso |
Utm Source/Medium/Campaign/Content/Term |
Estado | Cidade | Turma(3) |
Valor (convertido) Moeda + Valor (convertido) |
Cliente pessoal: Email | Mês da Venda | Data Nasc | Sexo |
CodigoDaUnidadeGeradora | Canal da Venda | Checkout Cispay |
ID da venda | Pacote do Aluno | Qtd parcelas |
Data de criação | Data de Aprovação | UTM GCLID |
Origem do lead | Última Origem do Lead | Data da Matrícula
```
- Turmas reais: `2026-CIS248-São Paulo` (2.274), `CIS249-BH` (1.118), `CIS250-Curitiba` (608), `CIS253-SP`, `CIS251-RJ`, `CIS252-Goiânia`, `CIS254-Orlando`.
- Estados: SP 1.342, MG 834, PR 436, SC/BA 196, MT 178, RJ 151, RS 143.
- Pacotes: Bronze, Diamond, etc.
- Canal da Venda: `CDT` 4.101, `Online` 275.
- Origem do lead: `Indicação` 1.364 (!), `Social Seller MCIS` 609, `Pedido` 447, `Marketing` 164...
- **UTMs estão quase todas vazias na aba Vendas** — atribuição de canal precisa vir de join com Leads (por email).
- Cidade tem case inconsistente (`São Paulo` vs `SÃO PAULO`) — normalizar.

## O que muda no app

O esquema atual (`planilha_leads` + `planilha_vendas` + `vendas_atribuidas`) tem o conceito certo, mas os campos não batem com o que existe. Precisamos:
1. Recriar tabelas alinhadas 1:1 com as colunas reais.
2. Reescrever o importador (uma planilha, duas abas, mapeamento novo).
3. Reescrever a view/função de atribuição (email → match com último lead).
4. Reformular os painéis e filtros para o que essas duas abas conseguem responder.

Tabelas antigas ficam preservadas (não dropamos agora), só desligadas do app.

---

## Plano

### 1. Schema novo

**`rd_leads`** (substitui `planilha_leads`)
```
id_lead_rd (text, unique)  · email (idx)  · nome  · telefone
proprietario · status_lead · unidade_rd · origem_lead · url_cadastro
data_criacao (timestamptz)
utm_origem · utm_midia · utm_campanha · utm_conteudo · utm_termo
canal (derivado)
import_batch_id · imported_at · raw (jsonb)
```

**`rd_vendas`** (substitui `planilha_vendas`)
```
id_venda (text, unique) · email (idx) · nome_cliente
proprietario · lead_origem · curso · codigo_curso · unidade_geradora
turma · pacote · promocao · canal_venda · checkout
fase · valor · valor_convertido · qtd_pagantes · qtd_parcelas
estado · cidade · sexo · data_nascimento
mes_venda · data_criacao · data_aprovacao · data_matricula
utm_source/medium/campaign/content/term · utm_gclid
origem_lead · ultima_origem_lead
import_batch_id · imported_at · raw (jsonb)
```

**`vendas_atribuidas`** vira **view** (não tabela) que junta `rd_vendas` + último `rd_leads` por email, deriva `canal` (preferindo UTMs do lead quando vendas estiverem vazias) e `tipo_atribuicao` (`Existente` / `Inferida` / `Sem Atribuição`).

Índices: `email`, `data_matricula`, `data_criacao`, `turma`, `estado`, `canal`, `status_lead`.

### 2. Importador (reescrita)

Em `src/server/import.functions.ts`:
- Aceita 1 URL e detecta as 2 abas (gid 0 = Leads, outro gid = Vendas) — ou 2 botões separados como já existe.
- Mapeamento novo (todos os 23 e 40 campos acima), com aliases case-insensitive.
- **Coalesce de Cidade**: `Cidade` ?? `Cidade(2)` ?? `Cidade de residência`. Mesmo para Estado.
- **Normalização**: cidade em Title Case (`SÃO PAULO` → `São Paulo`).
- **Datas Google Sheets** (`Date(2026,3,18,20,32,0)` — mês é 0-indexed!) — parser específico.
- **Valor**: BRL direto; logar e ignorar PYG (2 linhas).
- Upsert por `id_lead_rd` e `id_venda` (planilha cresce — não duplicar).
- Chunks de 200 com `linhas_inseridas` atualizado por chunk.
- `status='success'` sempre no `finally` (resolve o batch travado).
- Marcar manualmente o batch antigo `7587f002-...` como `success / 12000`.

### 3. Painéis — nova estrutura da sidebar

```
Visão Geral   → KPIs combinados leads+vendas + tendência
Funil         → Lead → Negociação → Venda Feita (RD) e funil de receita
Vendas        → Tabela + filtros (turma, estado, pacote, fase, canal)
Turmas        → Por turma: matrículas, receita, ticket médio, conversão
Geografia     → Estado/Cidade (mapa BR + tabela)
Canais        → UTM Origem normalizada + atribuição via leads
Campanhas     → UTM Campanha + UTM Conteúdo (drill-down)
Origem do Lead→ Indicação, Social Seller, Marketing, LPs (qualitativa)
Proprietários → Performance por SDR/closer (leads, conv, receita)
Pacotes       → Bronze/Diamond — distribuição e ticket
Importar      → mantém
Conta         → mantém
```

KPIs principais (Visão Geral):
- Leads no período · Vendas no período · Receita · Ticket médio
- Taxa lead→venda · Indicação% · Tempo médio lead→matrícula
- Top 5 turmas (receita) · Top 5 canais · Top 5 estados
- Tendência diária de matrículas e receita

### 4. Filtros globais

Período (`data_matricula`/`data_lead`) · Turma · Estado · Canal · Pacote · Fase da Venda · Proprietário · Origem do Lead.

### 5. Ordem de execução

1. Migration: criar `rd_leads`, `rd_vendas`, view `vendas_atribuidas_v2` + índices + RLS (auth read, admin write — padrão das tabelas existentes).
2. Marcar batch travado `7587f002-...` como `success`.
3. Reescrever `src/server/import.functions.ts` (Leads + Vendas, mapeamento novo, datas Google).
4. Reescrever `src/server/sheets.server.ts` para os novos aliases.
5. Importar Leads (133k em chunks) e Vendas (4,3k) da planilha.
6. Refazer cada rota da sidebar conforme lista acima.
7. Atualizar `GlobalFilters`, `lib/filters.tsx`, `lib/canal.ts` (já está OK, só conferir).
8. Atualizar `get_vendas_agg` (RPC) para a nova view.

### 6. O que **não** vai existir mais
- `planilha_leads` / `planilha_vendas` / `sem_atribuicao` — desligadas do app, dropadas em commit posterior.
- Página `Gaps` no formato atual (revisar se ainda faz sentido — provavelmente vira "Inferidas vs Sem Atribuição").

---

## Antes de começar — confirmar 2 coisas

1. **OK desligar (mas não dropar) as tabelas antigas** `planilha_leads`, `planilha_vendas`, `vendas_atribuidas`, `sem_atribuicao`?
2. **Atribuição por email** entre Vendas → Leads é a regra correta (último lead com mesmo email antes da matrícula)? Ou prefere outra (Id do lead, telefone)?
