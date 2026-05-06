import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  buildCsvUrl,
  buildHeaderMap,
  fetchCsvRows,
  parseDate,
  parseNumber,
  pick,
} from "./sheets.server";
import { deriveCanal } from "@/lib/canal";

const PreviewInput = z.object({
  sheetUrl: z.string().url(),
  gid: z.string().optional(),
});

export const previewSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => PreviewInput.parse(d))
  .handler(async ({ data, context }) => {
    // Só admin pode rodar
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (!roles?.some((r) => r.role === "admin")) {
      throw new Error("Apenas administradores podem importar planilhas.");
    }

    const csvUrl = buildCsvUrl(data.sheetUrl, data.gid);
    const rows = await fetchCsvRows(csvUrl);
    const headers = rows[0] ? Object.keys(rows[0]) : [];
    const headerMap = buildHeaderMap(headers);
    return {
      headers,
      headerMap,
      sample: rows.slice(0, 10),
      total: rows.length,
    };
  });

const ImportInput = z.object({
  sheetUrl: z.string().url(),
  gid: z.string().optional(),
  aba: z.enum(["leads", "vendas"]),
});

export const importSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ImportInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (!roles?.some((r) => r.role === "admin")) {
      throw new Error("Apenas administradores podem importar planilhas.");
    }

    // batch
    const { data: batch, error: batchErr } = await supabaseAdmin
      .from("planilha_imports")
      .insert({
        sheet_url: data.sheetUrl,
        aba: data.aba,
        status: "running",
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (batchErr || !batch) throw new Error("Falha ao criar batch: " + batchErr?.message);
    const batchId = batch.id;

    try {
      const csvUrl = buildCsvUrl(data.sheetUrl, data.gid);
      const rows = await fetchCsvRows(csvUrl);
      if (!rows.length) throw new Error("Planilha vazia ou sem cabeçalho.");
      const headerMap = buildHeaderMap(Object.keys(rows[0]));

      let inseridas = 0;

      if (data.aba === "leads") {
        const records = rows
          .map((r) => {
            const utm_source = pick(r, headerMap, "utm_source");
            const utm_medium = pick(r, headerMap, "utm_medium");
            const origem_lead = pick(r, headerMap, "origem_lead");
            return {
              email: pick(r, headerMap, "email"),
              telefone: pick(r, headerMap, "telefone"),
              nome: pick(r, headerMap, "nome"),
              data_lead: parseDate(pick(r, headerMap, "data_lead")),
              utm_source,
              utm_medium,
              utm_campaign: pick(r, headerMap, "utm_campaign"),
              utm_content: pick(r, headerMap, "utm_content"),
              utm_term: pick(r, headerMap, "utm_term"),
              origem_lead,
              canal: deriveCanal({ utm_source, utm_medium, origem_lead }),
              raw: r as any,
              import_batch_id: batchId,
            };
          })
          .filter((r) => r.email || r.telefone);

        // chunks de 500
        for (let i = 0; i < records.length; i += 500) {
          const chunk = records.slice(i, i + 500);
          const { error } = await supabaseAdmin
            .from("planilha_leads")
            .upsert(chunk as any, {
              onConflict: "email,data_lead,utm_source,utm_campaign",
              ignoreDuplicates: false,
            });
          if (error) {
            // fallback insert sem onConflict (índice expression-based pode não casar com upsert)
            const { error: e2 } = await supabaseAdmin.from("planilha_leads").insert(chunk as any);
            if (e2 && !e2.message.includes("duplicate")) throw e2;
          }
          inseridas += chunk.length;
        }
      } else {
        const records = rows
          .map((r) => {
            const utm_source = pick(r, headerMap, "utm_source");
            const utm_medium = pick(r, headerMap, "utm_medium");
            return {
              email: pick(r, headerMap, "email"),
              telefone: pick(r, headerMap, "telefone"),
              nome: pick(r, headerMap, "nome"),
              data_matricula: parseDate(pick(r, headerMap, "data_matricula")),
              valor_convertido: parseNumber(pick(r, headerMap, "valor_convertido")),
              turma: pick(r, headerMap, "turma"),
              cidade: pick(r, headerMap, "cidade"),
              estado: pick(r, headerMap, "estado"),
              utm_source,
              utm_medium,
              utm_campaign: pick(r, headerMap, "utm_campaign"),
              utm_content: pick(r, headerMap, "utm_content"),
              utm_term: pick(r, headerMap, "utm_term"),
              canal: deriveCanal({ utm_source, utm_medium }),
              raw: r as any,
              import_batch_id: batchId,
            };
          })
          .filter((r) => r.email || r.telefone);

        for (let i = 0; i < records.length; i += 500) {
          const chunk = records.slice(i, i + 500);
          const { error } = await supabaseAdmin.from("planilha_vendas").insert(chunk as any);
          if (error && !error.message.includes("duplicate")) throw error;
          inseridas += chunk.length;
        }

        // Atribuição last-touch: para cada venda recém-importada, buscar lead mais recente do mesmo email
        const { data: vendasBatch } = await supabaseAdmin
          .from("planilha_vendas")
          .select("id, email, data_matricula")
          .eq("import_batch_id", batchId);

        if (vendasBatch?.length) {
          for (const v of vendasBatch) {
            if (!v.email || !v.data_matricula) continue;
            const { data: lead } = await supabaseAdmin
              .from("planilha_leads")
              .select("id, data_lead")
              .ilike("email", v.email)
              .lte("data_lead", v.data_matricula)
              .order("data_lead", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (lead) {
              const dias =
                lead.data_lead
                  ? Math.floor(
                      (new Date(v.data_matricula).getTime() - new Date(lead.data_lead).getTime()) /
                        86400000,
                    )
                  : null;
              await supabaseAdmin
                .from("planilha_vendas")
                .update({ lead_id: lead.id, lead_data: lead.data_lead, dias_lead_para_venda: dias })
                .eq("id", v.id);
            }
          }
        }
      }

      await supabaseAdmin
        .from("planilha_imports")
        .update({ status: "success", linhas_inseridas: inseridas })
        .eq("id", batchId);

      return { ok: true, batchId, inseridas };
    } catch (err: any) {
      await supabaseAdmin
        .from("planilha_imports")
        .update({ status: "error", erro: err?.message ?? String(err) })
        .eq("id", batchId);
      throw err;
    }
  });
