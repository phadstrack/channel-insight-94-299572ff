import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFilters, applyVendasFilters } from "@/lib/filters";
import { PageHeader, Card } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { fmtBRL, fmtBRLFull, fmtNum, fmtPct, channelColor, CANAIS_LIST } from "@/lib/format";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/canais")({
  head: () => ({
    meta: [
      { title: "Canais · Febracis MKT" },
      { name: "description", content: "Performance detalhada por canal de marketing." },
    ],
  }),
  component: Canais,
});

const CHANNELS = ["Todos", ...CANAIS_LIST];

function Canais() {
  const { filters } = useFilters();
  const [canal, setCanal] = useState<string>("Todos");

  // Breakdown agregado server-side (todas as 7 categorias)
  const { data: breakdown, isLoading: loadingBreak } = useQuery({
    queryKey: ["canais-breakdown", filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_canais_breakdown", {
        p_date_from: filters.dateFrom ?? null,
        p_date_to: filters.dateTo ?? null,
        p_turmas: filters.turmas.length ? filters.turmas : null,
        p_estados: filters.estados.length ? filters.estados : null,
      });
      if (error) throw error;
      return (data ?? []) as { canal: string; vendas: number; receita: number; ticket: number }[];
    },
  });

  // Linhas detalhadas (campanhas, conteúdos, tendência) — só do canal selecionado
  const { data: rows, isLoading } = useQuery({
    queryKey: ["canais-detail", canal, filters],
    queryFn: async () => {
      let q = supabase
        .from("vendas_atribuidas")
        .select("canal, valor_convertido, utm_campanha, utm_conteudo, data_matricula")
        .limit(10000);
      if (canal !== "Todos") q = q.eq("canal", canal) as any;
      const { data, error } = await applyVendasFilters(q as any, { ...filters, canais: [] });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const data = rows ?? [];
  const bk = breakdown ?? [];
  const totalVendas = bk.reduce((s, r) => s + Number(r.vendas), 0);
  const totalReceita = bk.reduce((s, r) => s + Number(r.receita), 0);
  const ticketGeral = totalVendas > 0 ? totalReceita / totalVendas : 0;

  const isAll = canal === "Todos";
  const sel = bk.find((r) => r.canal === canal);
  const vendasSel = isAll ? totalVendas : Number(sel?.vendas ?? 0);
  const receitaSel = isAll ? totalReceita : Number(sel?.receita ?? 0);
  const ticketSel = vendasSel > 0 ? receitaSel / vendasSel : 0;
  const pctSel = totalReceita > 0 ? (receitaSel / totalReceita) * 100 : 0;

  const aggBy = (key: string) => {
    const m: Record<string, { vendas: number; receita: number }> = {};
    for (const r of data) {
      const k = (r as any)[key] || "(sem valor)";
      m[k] = m[k] || { vendas: 0, receita: 0 };
      m[k].vendas += 1;
      m[k].receita += Number(r.valor_convertido ?? 0);
    }
    return Object.entries(m)
      .map(([k, v]) => ({ key: k, vendas: v.vendas, receita: v.receita, ticket: v.vendas > 0 ? v.receita / v.vendas : 0 }))
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 20);
  };

  const campanhas = aggBy("utm_campanha");
  const conteudos = aggBy("utm_conteudo");

  const monthly: Record<string, number> = {};
  for (const r of data) {
    if (!r.data_matricula) continue;
    const m = String(r.data_matricula).slice(0, 7);
    monthly[m] = (monthly[m] ?? 0) + Number(r.valor_convertido ?? 0);
  }
  const trend = Object.entries(monthly).sort().map(([m, v]) => ({ mes: m, receita: v }));

  const accent = isAll ? "#6366f1" : channelColor(canal);

  return (
    <>
      <PageHeader title="Canais" subtitle="Performance detalhada por canal de marketing" />
      <GlobalFilters />

      <div className="flex flex-wrap gap-2 mb-6">
        {CHANNELS.map((c) => {
          const active = canal === c;
          return (
            <button
              key={c}
              onClick={() => setCanal(c)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium border transition flex items-center gap-2",
                active
                  ? "bg-card border-primary/40 text-foreground"
                  : "bg-card/40 border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="size-2.5 rounded-sm" style={{ background: c === "Todos" ? "#6366f1" : channelColor(c) }} />
              {c}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label={isAll ? "Vendas Totais" : "Vendas"} value={fmtNum(vendasSel)} loading={loadingBreak} accent={accent} />
        <KpiCard
          label={isAll ? "Receita Total" : "Receita"}
          value={fmtBRLFull(receitaSel)}
          hint={!isAll ? `${fmtPct(pctSel)} do total (${fmtBRL(totalReceita)})` : undefined}
          loading={loadingBreak}
          accent={accent}
        />
        <KpiCard label={isAll ? "Ticket Médio Geral" : "Ticket Médio"} value={fmtBRLFull(isAll ? ticketGeral : ticketSel)} loading={loadingBreak} accent={accent} />
        <KpiCard
          label={isAll ? "Canais Ativos" : "% do Total"}
          value={isAll ? `${bk.filter((r) => r.vendas > 0).length}` : fmtPct(pctSel)}
          loading={loadingBreak}
          accent={accent}
        />
      </div>

      {isAll && (
        <Card title="Receita por canal" className="mb-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bk} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
                <XAxis dataKey="canal" stroke="#9ca3af" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtBRL(v)} />
                <Tooltip
                  cursor={{ fill: "#ffffff08" }}
                  contentStyle={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [fmtBRLFull(Number(v)), "Receita"]}
                />
                <Bar dataKey="receita" radius={[6, 6, 0, 0]}>
                  {bk.map((c) => (
                    <Cell key={c.canal} fill={channelColor(c.canal)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card title="Tendência mensal" className="mb-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
              <XAxis dataKey="mes" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtBRL(v)} />
              <Tooltip
                contentStyle={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [fmtBRLFull(Number(v)), "Receita"]}
              />
              <Line type="monotone" dataKey="receita" stroke={accent} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {isAll && (
        <Card title="Detalhamento por canal" className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="py-2 pr-4">Canal</th>
                  <th className="py-2 pr-4 text-right">Vendas</th>
                  <th className="py-2 pr-4 text-right">Receita</th>
                  <th className="py-2 pr-4 text-right">Ticket Médio</th>
                  <th className="py-2 pr-4 text-right">% do Total</th>
                </tr>
              </thead>
              <tbody>
                {bk.map((r) => (
                  <tr key={r.canal} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4 font-medium">
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-sm" style={{ background: channelColor(r.canal) }} />
                        {r.canal}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">{fmtNum(Number(r.vendas))}</td>
                    <td className="py-3 pr-4 text-right font-semibold">{fmtBRLFull(Number(r.receita))}</td>
                    <td className="py-3 pr-4 text-right">{fmtBRLFull(Number(r.ticket))}</td>
                    <td className="py-3 pr-4 text-right text-muted-foreground">
                      {fmtPct(totalReceita > 0 ? (Number(r.receita) / totalReceita) * 100 : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RankTable title="Top campanhas (utm_campanha)" rows={campanhas} loading={isLoading} />
        <RankTable title="Top conteúdos (utm_conteudo)" rows={conteudos} loading={isLoading} />
      </div>
    </>
  );
}

function RankTable({ title, rows, loading }: { title: string; rows: { key: string; vendas: number; receita: number; ticket: number }[]; loading?: boolean }) {
  return (
    <Card title={title}>
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card">
            <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
              <th className="py-2 pr-4">Item</th>
              <th className="py-2 pr-4 text-right">Vendas</th>
              <th className="py-2 pr-4 text-right">Receita</th>
              <th className="py-2 pr-4 text-right">Ticket</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                  Sem dados
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-border/40 last:border-0">
                <td className="py-2 pr-4 max-w-[260px] truncate" title={r.key}>{r.key}</td>
                <td className="py-2 pr-4 text-right">{fmtNum(r.vendas)}</td>
                <td className="py-2 pr-4 text-right font-medium">{fmtBRL(r.receita)}</td>
                <td className="py-2 pr-4 text-right text-muted-foreground">{fmtBRL(r.ticket)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
