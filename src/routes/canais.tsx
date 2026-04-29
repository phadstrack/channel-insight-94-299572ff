import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFilters, applyVendasFilters } from "@/lib/filters";
import { PageHeader, Card } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { fmtBRL, fmtBRLFull, fmtNum, fmtPct, channelColor } from "@/lib/format";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
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

const CHANNELS = ["Todos", "Meta/Instagram", "Google", "Orgânico", "Lead Tráfego", "X (Twitter)"];

function Canais() {
  const { filters } = useFilters();
  const [canal, setCanal] = useState<string>("Meta/Instagram");

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

  const { data: totalRows } = useQuery({
    queryKey: ["canais-total", filters],
    queryFn: async () => {
      const q = supabase.from("vendas_atribuidas").select("valor_convertido").limit(10000);
      const { data, error } = await applyVendasFilters(q as any, { ...filters, canais: [] });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const data = rows ?? [];
  const totalReceita = (totalRows ?? []).reduce((s, r: any) => s + Number(r.valor_convertido ?? 0), 0);
  const vendas = data.length;
  const receita = data.reduce((s, r: any) => s + Number(r.valor_convertido ?? 0), 0);
  const ticket = vendas > 0 ? receita / vendas : 0;
  const pct = totalReceita > 0 ? (receita / totalReceita) * 100 : 0;

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

  // monthly
  const monthly: Record<string, number> = {};
  for (const r of data) {
    if (!r.data_matricula) continue;
    const m = String(r.data_matricula).slice(0, 7); // YYYY-MM
    monthly[m] = (monthly[m] ?? 0) + Number(r.valor_convertido ?? 0);
  }
  const trend = Object.entries(monthly)
    .sort()
    .map(([m, v]) => ({ mes: m, receita: v }));

  return (
    <>
      <PageHeader title="Canais" subtitle="Performance detalhada por canal de marketing" />
      <GlobalFilters />

      <div className="flex flex-wrap gap-2 mb-6">
        {CHANNELS.map((c) => (
          <button
            key={c}
            onClick={() => setCanal(c)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium border transition flex items-center gap-2",
              canal === c
                ? "bg-card border-primary/40 text-foreground"
                : "bg-card/40 border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="size-2.5 rounded-sm" style={{ background: channelColor(c) }} />
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Vendas" value={fmtNum(vendas)} loading={isLoading} accent={channelColor(canal)} />
        <KpiCard label="Receita" value={fmtBRLFull(receita)} loading={isLoading} accent={channelColor(canal)} />
        <KpiCard label="Ticket Médio" value={fmtBRLFull(ticket)} loading={isLoading} accent={channelColor(canal)} />
        <KpiCard label="% do Total" value={fmtPct(pct)} loading={isLoading} accent={channelColor(canal)} />
      </div>

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
              <Line type="monotone" dataKey="receita" stroke={channelColor(canal)} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RankTable title="Top campanhas (utm_campanha)" rows={campanhas} />
        <RankTable title="Top conteúdos (utm_conteudo)" rows={conteudos} />
      </div>
    </>
  );
}

function RankTable({ title, rows }: { title: string; rows: { key: string; vendas: number; receita: number; ticket: number }[] }) {
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                  Sem dados para este canal
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
