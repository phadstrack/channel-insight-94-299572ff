import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  buildCsvUrl,
  buildHeaderMap,
  fetchCsvRows,
  parseDate,
  parseTimestamp,
  parseNumber,
  parseInt0,
  titleCase,
  pick,
} from "./sheets.server";
import { deriveCanal } from "@/lib/canal";

const PreviewInput = z.object({
  sheetUrl: z.string().url(),
  gid: z.string().optional(),
});

async function assertAdmin(ctx: any) {
  const { data: roles, error } = await ctx.supabase
    .from("user_roles").select("role").eq("user_id", ctx.userId);
  if (error) throw new Error("Falha ao verificar permissões: " + error.message);
  if (!roles?.some((r: any) => r.role === "admin")) {
    throw new Error("Apenas administradores podem importar planilhas.");
  }
}

export const previewSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => PreviewInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const csvUrl = buildCsvUrl(data.sheetUrl, data.gid);
    const rows = await fetchCsvRows(csvUrl);
    const headers = rows.length && rows[0] ? Object.keys(rows[0]) : [];
    const headerMap = buildHeaderMap(headers);
    return { headers, headerMap, sample: rows.slice(0, 10), total: rows.length };
  });

const ImportInput = z.object({
  sheetUrl: z.string().url(),
  gid: z.string().optional(),
  aba: z.enum(["leads", "vendas"]),
});

const CHUNK = 200;

export const importSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ImportInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { data: batch, error: batchErr } = await context.supabase
      .from("planilha_imports")
      .insert({
        sheet_url: data.sheetUrl,
        aba: data.aba,
        status: "running",
        created_by: context.userId,
      })
      .select("id").single();
    if (batchErr || !batch) throw new Error("Falha ao criar batch: " + batchErr?.message);
    const batchId = batch.id;

    let inseridas = 0;
    let finalStatus: "success" | "error" = "success";
    let finalErro: string | null = null;

    try {
      const csvUrl = buildCsvUrl(data.sheetUrl, data.gid);
      const rows = await fetchCsvRows(csvUrl);
      if (!rows.length) throw new Error("Planilha vazia ou sem cabeçalho.");
      const headerMap = buildHeaderMap(Object.keys(rows[0]));

      if (data.aba === "leads") {
        const records = rows.map((r) => {
          const utm_origem = pick(r, headerMap, "utm_origem");
          const utm_midia  = pick(r, headerMap, "utm_midia");
          const origem_lead = pick(r, headerMap, "origem_lead");
          return {
            id_lead_rd: pick(r, headerMap, "id_lead_rd"),
            email: pick(r, headerMap, "email"),
            nome: pick(r, headerMap, "nome"),
            telefone: pick(r, headerMap, "telefone"),
            proprietario: pick(r, headerMap, "proprietario"),
            status_lead: pick(r, headerMap, "status_lead"),
            unidade_rd: pick(r, headerMap, "unidade_rd"),
            origem_lead,
            url_cadastro: pick(r, headerMap, "url_cadastro"),
            data_criacao: parseTimestamp(pick(r, headerMap, "data_lead_criacao")),
            utm_origem,
            utm_midia,
            utm_campanha: pick(r, headerMap, "utm_campanha"),
            utm_conteudo: pick(r, headerMap, "utm_conteudo"),
            utm_termo: pick(r, headerMap, "utm_termo"),
            cidade: titleCase(pick(r, headerMap, "cidade")),
            estado: pick(r, headerMap, "estado"),
            objecoes: pick(r, headerMap, "objecoes"),
            canal: deriveCanal({
              utm_source: utm_origem, utm_medium: utm_midia, origem_lead,
            }),
            raw: r as any,
            import_batch_id: batchId,
          };
        }).filter((r) => r.id_lead_rd || r.email);

        // Deduplica por id_lead_rd (mantém última ocorrência) — evita
        // "ON CONFLICT DO UPDATE cannot affect row a second time"
        const seenL = new Map<string, any>();
        const dedupL: any[] = [];
        for (const r of records) {
          if (r.id_lead_rd) seenL.set(r.id_lead_rd, r);
          else dedupL.push(r);
        }
        const recordsDedup = [...seenL.values(), ...dedupL];

        for (let i = 0; i < recordsDedup.length; i += CHUNK) {
          const chunk = recordsDedup.slice(i, i + CHUNK);
          const withId = chunk.filter((r) => r.id_lead_rd);
          const noId   = chunk.filter((r) => !r.id_lead_rd);
          if (withId.length) {
            const { error } = await context.supabase
              .from("rd_leads").upsert(withId as any, { onConflict: "id_lead_rd" });
            if (error) throw error;
          }
          if (noId.length) {
            const { error } = await context.supabase.from("rd_leads").insert(noId as any);
            if (error) throw error;
          }
          inseridas += chunk.length;
          await context.supabase.from("planilha_imports")
            .update({ linhas_inseridas: inseridas }).eq("id", batchId);
        }
      } else {
        const records = rows.map((r) => {
          const utm_source = pick(r, headerMap, "utm_origem");
          const utm_medium = pick(r, headerMap, "utm_midia");
          const origem_lead = pick(r, headerMap, "origem_lead");
          return {
            id_venda: pick(r, headerMap, "id_venda"),
            email: pick(r, headerMap, "email"),
            nome_cliente: pick(r, headerMap, "nome"),
            nome_venda: pick(r, headerMap, "nome_venda"),
            proprietario: pick(r, headerMap, "proprietario"),
            lead_origem: pick(r, headerMap, "lead_origem"),
            curso: pick(r, headerMap, "curso"),
            codigo_curso: pick(r, headerMap, "codigo_curso"),
            unidade_geradora: pick(r, headerMap, "unidade_geradora"),
            codigo_unidade: pick(r, headerMap, "codigo_unidade"),
            turma: pick(r, headerMap, "turma"),
            pacote: pick(r, headerMap, "pacote"),
            promocao: pick(r, headerMap, "promocao"),
            canal_venda: pick(r, headerMap, "canal_venda"),
            checkout: pick(r, headerMap, "checkout"),
            fase: pick(r, headerMap, "fase"),
            valor: parseNumber(pick(r, headerMap, "valor")),
            valor_moeda: pick(r, headerMap, "valor_moeda"),
            valor_convertido: parseNumber(pick(r, headerMap, "valor_convertido")),
            qtd_pagantes: parseInt0(pick(r, headerMap, "qtd_pagantes")),
            qtd_parcelas: parseInt0(pick(r, headerMap, "qtd_parcelas")),
            estado: pick(r, headerMap, "estado"),
            cidade: titleCase(pick(r, headerMap, "cidade")),
            sexo: pick(r, headerMap, "sexo"),
            data_nascimento: parseDate(pick(r, headerMap, "data_nascimento")),
            mes_venda: pick(r, headerMap, "mes_venda"),
            data_criacao: parseTimestamp(pick(r, headerMap, "data_venda_criacao")),
            data_aprovacao: parseTimestamp(pick(r, headerMap, "data_aprovacao")),
            data_matricula: parseTimestamp(pick(r, headerMap, "data_matricula")),
            telefone: pick(r, headerMap, "telefone"),
            venda_pai: pick(r, headerMap, "venda_pai"),
            utm_source,
            utm_medium,
            utm_campaign: pick(r, headerMap, "utm_campanha"),
            utm_content: pick(r, headerMap, "utm_conteudo"),
            utm_term: pick(r, headerMap, "utm_termo"),
            utm_gclid: pick(r, headerMap, "utm_gclid"),
            origem_lead,
            ultima_origem_lead: pick(r, headerMap, "ultima_origem_lead"),
            raw: r as any,
            import_batch_id: batchId,
          };
        }).filter((r) => r.id_venda || r.email);

        // 1) Dedup por nome_venda + valor_convertido (mantém última ocorrência)
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
        const noId2: any[] = [];
        for (const r of afterNV) {
          if (r.id_venda) seenId.set(r.id_venda, r);
          else noId2.push(r);
        }
        const recordsDedup: any[] = [...seenId.values(), ...noId2];

        for (let i = 0; i < recordsDedup.length; i += CHUNK) {
          const chunk = recordsDedup.slice(i, i + CHUNK);
          const withId = chunk.filter((r) => r.id_venda);
          const noId   = chunk.filter((r) => !r.id_venda);
          if (withId.length) {
            const { error } = await context.supabase
              .from("rd_vendas").upsert(withId as any, { onConflict: "id_venda" });
            if (error) throw error;
          }
          if (noId.length) {
            const { error } = await context.supabase.from("rd_vendas").insert(noId as any);
            if (error) throw error;
          }
          inseridas += chunk.length;
          await context.supabase.from("planilha_imports")
            .update({ linhas_inseridas: inseridas }).eq("id", batchId);
        }
      }
    } catch (err: any) {
      finalStatus = "error";
      finalErro = err?.message ?? String(err);
    } finally {
      await context.supabase.from("planilha_imports")
        .update({ status: finalStatus, linhas_inseridas: inseridas, erro: finalErro })
        .eq("id", batchId);
    }

    if (finalStatus === "error") throw new Error(finalErro ?? "Erro desconhecido");
    return { ok: true, batchId, inseridas };
  });
