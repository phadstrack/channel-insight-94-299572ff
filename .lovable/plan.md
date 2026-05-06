## Problema

A pré-visualização funciona porque só lê CSV público — não toca no Supabase admin. Já a importação usa `supabaseAdmin` (client com service role) para gravar em `planilha_imports`, `planilha_leads` e `planilha_vendas`. O erro real é:

```
Missing Supabase server environment variables.
Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
```

Inspecionando o `.env` do projeto, só estão presentes `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e os `VITE_*`. **Falta o `SUPABASE_SERVICE_ROLE_KEY`** — ele existe nos secrets do Supabase (usado por edge functions), mas não no `.env` que o dev-server do TanStack Start lê em tempo de execução.

## Correção

1. Adicionar `SUPABASE_SERVICE_ROLE_KEY=...` ao `.env` do projeto, copiando o valor do secret já configurado no Supabase. Isso resolve tanto dev quanto produção (Worker lê do mesmo conjunto de variáveis).
2. Não há mudança de código necessária — `client.server.ts` já lê `process.env.SUPABASE_SERVICE_ROLE_KEY` corretamente e está protegido contra uso no client.

Após a alteração, reimportar a aba Leads/Vendas funcionará.

## Segurança

`SUPABASE_SERVICE_ROLE_KEY` permanece apenas no servidor (arquivo `.server.ts` é bloqueado pelo Vite no bundle do client). Nada novo é exposto ao navegador.
