# Reestruturação da Atribuição

## Princípios (definidos pelo usuário)

1. **Canal = última origem** (`ultima_origem_lead`) como fonte principal.
2. **Origem original** (`origem_lead`) como fallback quando última origem está vazia.
3. **UTMs nunca decidem o canal** — entram como evidência de apoio. `utm_source` é exibida sempre nas tabelas e detalhes.
4. Vendas que não classificarem por nenhuma das origens caem em **Outros**.
5. Nova tela de **SQL Explorer** para o usuário cruzar leads/vendas livremente (estilo Power BI / consulta).

---

## 1. Nova função `derive_canal_v2()` no banco

Assinatura: `derive_canal_v2(p_ultima_origem, p_origem, p_utm_source, p_utm_medium)`.

Lógica em ordem:

```text
fonte = COALESCE(NULLIF(ultima_origem,''), origem)   -- decisor único
se fonte vazia → "Sem Atribuição"

classificar fonte (regex sobre o texto da origem, NÃO da UTM):
  YouTube     ← youtube, [yt], yt, iex app (canal próprio de vídeo)
  CRM         ← email, e-mail, mailchimp, rdstation, whats, wpp, sz chat,
                disparo marketing, hotmart (email-driven)
  Redes       ← social seller, ss, ss mcis, ss pv/cv, indicação,
                aluno cis, ex-aluno, stand cis, ativação comercial,
                avalon - social seller
  Mídia       ← [fb], [go], [cm], [lp], [vsl], [pgven], [ck],
                form - meta lead ads, meta lead ads, tráfego,
                lead tráfego, ads, typeform (LP de captação paga),
                lp - black, lp - masterclass, ia mcis, meteorico,
                mulheres experience
  Orgânicos   ← [org], orgânico, organic, seo, site
  Operacional ← pedido, cortesia, bonux, transferido, checkout bônus,
                cliente base, base dksoft, lista de espera (segregado
                de marketing — não é canal de aquisição)
  Outros      ← qualquer outra fonte preenchida
```

UTM **não influencia** a classificação — é só metadado exibido.

---

## 2. View `vendas_atribuidas` reconstruída

Colunas adicionadas/redefinidas:

- `canal` ← `derive_canal_v2(ultima_origem_lead, origem_lead, utm_source, utm_medium)`
- `fonte_atribuicao` ← string indicando qual campo decidiu: `"ultima_origem"`, `"origem"`, `"sem_origem"`
- `origem_principal` ← `COALESCE(NULLIF(ultima_origem_lead,''), origem_lead)` (texto bruto exibido)
- `origem_secundaria` ← a outra (origem original quando última foi usada)
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` ← sempre vindos de `fct_venda` (sale-side); UTM do lead vai em colunas separadas `lead_utm_source` etc. para auditoria
- `tipo_atribuicao` continua, mas refletindo o novo critério

---

## 3. Atualizar frontend

### `src/lib/canal.ts`
Reescrever `deriveCanal()` para espelhar `derive_canal_v2`: aceita `{ ultima_origem_lead, origem_lead }` como sinais primários e ignora UTM para decisão.

### Novo canal "Operacional"
Adicionar em `CANAIS_LIST` (`src/lib/format.ts`) com cor própria. Atualizar `GlobalFilters` automaticamente (já lê de `CANAIS_LIST`).

### `src/routes/canais.tsx`
- Tabela "Detalhamento por canal" ganha colunas: **Origem principal (top 3)** e **UTM source (top 3)** por canal — mostra a evidência sem deixá-la decidir.
- Top campanhas passa a agregar por **`origem_principal`** em vez de `utm_campanha` (com `utm_campanha` como segunda tabela).

### `src/routes/origem.tsx`
- Mostrar **duas tabelas lado a lado**: "Última origem" (principal) e "Origem original" (secundária).
- Cada linha mostra também a `utm_source` mais comum daquela origem.

### `src/routes/vendas.tsx`
Adicionar coluna `Origem principal` + `utm_source` visível por padrão. (Verificar arquivo antes; se já existir tabela, só adicionar colunas.)

### `src/routes/index.tsx`
KPI "Atribuição Identificada" passa a contar vendas onde `fonte_atribuicao IN ('ultima_origem','origem')`.

---

## 4. Nova tela: SQL Explorer (`/explorer`)

Tela tipo "consulta livre" para o usuário fazer análises ad-hoc (substitui a necessidade da tela de regras editáveis).

**Backend**: server function `runReadQuery` em `src/lib/explorer.functions.ts`:
- Aceita uma string SQL.
- Valida que começa com `SELECT` ou `WITH` (regex), bloqueia `;` múltiplos, palavras-chave `INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|CREATE`.
- Executa via cliente Supabase service-role com `LIMIT 5000` forçado.
- Restringe acesso a um **whitelist de views/tabelas seguras**: `vendas_atribuidas`, `fct_venda`, `fct_lead`, `bridge_lead_venda`, `dim_pessoa`, `rd_vendas`, `rd_leads`, `meta_ads_spend`, `google_ads_spend`. Bloqueia qualquer referência a `auth.*`, `user_roles`, `profiles`.
- Protegida por `requireSupabaseAuth` + check `has_role(uid,'admin')`.

**Frontend** (`src/routes/explorer.tsx`):
- Editor de SQL (textarea com mono font; usar `@/components/ui/textarea`).
- Painel lateral com **lista de tabelas/colunas disponíveis** (lido de uma constante TS espelhando o whitelist + colunas conhecidas).
- Botão "Executar" → mostra resultado em tabela paginada com export CSV.
- Snippets prontos: "Vendas por última origem", "Leads sem venda nos últimos 30d", "UTMs por canal", "Gap entre origem e última origem".
- Histórico das últimas 20 queries no localStorage.

Adicionar item "Explorer" no `Sidebar.tsx`.

---

## Detalhes técnicos

- **Migração SQL**: cria `derive_canal_v2`, recria view `vendas_atribuidas` com novas colunas, mantém `derive_canal` antiga por compatibilidade mas sem uso.
- **Sem mudança em `fct_venda`/`fct_lead`** — só na view e na função.
- **`get_canais_breakdown`** continua funcionando (lê do view atualizado), só passa a refletir a nova classificação automaticamente.
- **Tipos do Supabase** (`src/integrations/supabase/types.ts`) regenerados após a migração.

---

## Entregáveis

```text
supabase/migrations/<ts>_attribution_v2.sql   (derive_canal_v2 + view + grants RPC explorer)
src/lib/canal.ts                               (reescrito)
src/lib/format.ts                              (CANAIS_LIST + cor "Operacional")
src/lib/explorer.functions.ts                  (runReadQuery server fn)
src/routes/explorer.tsx                        (nova tela)
src/routes/canais.tsx                          (colunas de evidência)
src/routes/origem.tsx                          (dual: última × original)
src/routes/index.tsx                           (KPI ajustado)
src/components/dashboard/Sidebar.tsx           (item Explorer)
```
