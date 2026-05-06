## Deduplicar vendas por nome_venda + valor_convertido (e fallback por id_venda)

Ajuste no importer da aba **Vendas** em `src/server/import.functions.ts`.

### Nova ordem de deduplicação

1. **1ª passada — por `nome_venda` + `valor_convertido`** (principal)
   - Chave: `lower(trim(nome_venda)) | valor_convertido`
   - Mantém a última ocorrência.
   - Linhas sem `nome_venda` passam intactas.

2. **2ª passada — por `id_venda`** (fallback de segurança)
   - Após o passo 1, se ainda restarem `id_venda` repetidos no mesmo lote, mantém apenas 1 (última ocorrência).
   - Necessário para evitar o erro `ON CONFLICT ... cannot affect row a second time` no upsert.

3. Resultado vai para upsert em chunks de 200 em `rd_vendas` (`onConflict: id_venda`).

### Código (substitui o bloco atual de dedup)

```ts
// 1) Dedup por nome_venda + valor_convertido
const seenNV = new Map<string, any>();
const noKey: any[] = [];
for (const r of records) {
  const nv = (r.nome_venda ?? "").toString().trim().toLowerCase();
  const vc = r.valor_convertido ?? 0;
  if (nv) seenNV.set(`${nv}|${vc}`, r);
  else noKey.push(r);
}
const afterNV: any[] = [...seenNV.values(), ...noKey];

// 2) Fallback: garantir id_venda único no lote
const seenId = new Map<string, any>();
const noId: any[] = [];
for (const r of afterNV) {
  if (r.id_venda) seenId.set(r.id_venda, r);
  else noId.push(r);
}
const recordsDedup: any[] = [...seenId.values(), ...noId];
```

### Escopo
- Apenas `src/server/import.functions.ts` (bloco `aba === "vendas"`).
- Sem mudanças no banco; sem mudanças na aba Leads.
- Não toca dados históricos já em `rd_vendas`.