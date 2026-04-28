import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { applyVendasFilters, useFilters } from "@/lib/filters";
import { PageHeader, Card } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { CHANNEL_COLORS, channelColor, fmtBRL, fmtBRLFull, fmtNum, fmtPct, TIPO_BADGE } from "@/lib/format";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral · Febracis MKT" },
      { name: "description", content: "Visão geral da atribuição de marketing Febracis." },
    ],
  }),
  component: Overview,
});

type Row = {
  canal: string;
  tipo_atribuicao: string;
  valor_convertido: number;
};

function Overview() {
  const { filters } = useFilters();

  const { data, isLoading } = useQuery({
    queryKey: ["overview", filters],
    queryFn: async () => {
      const q = supabase
        .from("vendas_atribuidas")
        .select("canal, tipo_atribuicao, valor_convertido")
        .limit(5000);
      const { data, error } = await applyVendasFilters(q as any, filters);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const rows = data ?? [];

  // Aggregations
  const totalVendas = rows.length;
  const receitaTotal = rows.reduce((s, r) => s + Number(r.valor_convertido ?? 0), 0);
  const ticket = totalVendas > 0 ? receitaTotal / totalVendas : 0;

  const tipoMap: Record<string, { vendas: number; receita: number }> = {};
  const canalMap: Record<string, { vendas: number; receita: number; tipo: string }> = {};
  for (const r of rows) {
    const t = r.tipo_atribuicao || "Sem Atribuicao";
    tipoMap[t] = tipoMap[t] || { vendas: 0, receita: 0 };
    tipoMap[t].vendas += 1;
    tipoMap[t].receita += Number(r.valor_convertido ?? 0);

    const c = r.canal || "Sem Lead";
    canalMap[c] = canalMap[c] || { vendas: 0, receita: 0, tipo: t };
    canalMap[c].vendas += 1;
    canalMap[c].receita += Number(r.valor_convertido ?? 0);
  }

  const pctIdent =
    totalVendas > 0
      ? ((tipoMap["Existente"]?.vendas ?? 0) / totalVendas) * 100
      : 0;

  const canalRows = Object.entries(canalMap)
    .map(([canal, v]) => ({
      canal,
      vendas: v.vendas,
      receita: v.receita,
      ticket: v.vendas > 0 ? v.receita / v.vendas : 0,
      pct: receitaTotal > 0 ? (v.receita / receitaTotal) * 100 : 0,
      tipo: v.tipo,
    }))
    .sort((a, b) => b.receita - a.receita);

  const tipoRows = Object.entries(tipoMap).map(([tipo, v]) => ({
    name: tipo,
    value: v.vendas,
    receita: v.receita,
  }));

  const tipoColors: Record<string, string> = {
    Existente: "#4ade80",
    Inferida: "#f59e0b",
    "Sem Atribuicao": "#f87171",
  };

  return (
    <>
      <PageHeader
        title="Visão Geral"
        subtitle="Atribuição last-click de vendas Febracis"
      />
      <GlobalFilters />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Receita Total" value={fmtBRLFull(receitaTotal)} accent="#6366f1" loading={isLoading} />
        <KpiCard label="Total de Vendas" value={fmtNum(totalVendas)} accent="#8b5cf6" loading={isLoading} />
        <KpiCard label="Ticket Médio" value={fmtBRLFull(ticket)} accent="#a78bfa" loading={isLoading} />
        <KpiCard
          label="Canal Identificado"
          value={
            <span className="flex items-center gap-2">
              {fmtPct(pctIdent)}
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${TIPO_BADGE.Existente}`}>
                Existente
              </span>
            </span>
          }
          accent="#4ade80"
          loading={isLoading}
        />
      </div>

      <Card title="Cobertura de atribuição" className="mb-6">
        <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted">
          {canalRows.map((c) => (
            <div
              key={c.canal}
              style={{
                width: `${c.pct}%`,
                background: channelColor(c.canal),
              }}
              title={`${c.canal}: ${fmtPct(c.pct)}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
          {canalRows.map((c) => (
            <div key={c.canal} className="flex items-center gap-2 text-xs">
              <span
                className="size-2.5 rounded-sm"
                style={{ background: channelColor(c.canal) }}
              />
              <span className="text-foreground font-medium">{c.canal}</span>
              <span className="text-muted-foreground">{fmtPct(c.pct)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Receita por Canal" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={canalRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
                <XAxis dataKey="canal" stroke="#9ca3af" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtBRL(v)} />
                <Tooltip
                  cursor={{ fill: "#ffffff08" }}
                  contentStyle={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [fmtBRLFull(Number(v)), "Receita"]}
                />
                <Bar dataKey="receita" radius={[6, 6, 0, 0]}>
                  {canalRows.map((c) => (
                    <Cell key={c.canal} fill={channelColor(c.canal)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Tipo de Atribuição">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tipoRows} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {tipoRows.map((t) => (
                    <Cell key={t.name} fill={tipoColors[t.name] ?? "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any, n: any) => [fmtNum(Number(v)), n]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {tipoRows.map((t) => (
              <div key={t.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm" style={{ background: tipoColors[t.name] ?? "#6b7280" }} />
                  {t.name}
                </span>
                <span className="text-muted-foreground">
                  {fmtNum(t.value)} · {fmtPct(totalVendas > 0 ? (t.value / totalVendas) * 100 : 0)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Detalhamento por Canal">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="py-2 pr-4">Canal</th>
                <th className="py-2 pr-4 text-right">Vendas</th>
                <th className="py-2 pr-4 text-right">Receita</th>
                <th className="py-2 pr-4 text-right">Ticket Médio</th>
                <th className="py-2 pr-4 text-right">% do Total</th>
                <th className="py-2 pr-4">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {canalRows.map((r) => (
                <tr key={r.canal} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-4 font-medium">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm" style={{ background: channelColor(r.canal) }} />
                      {r.canal}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">{fmtNum(r.vendas)}</td>
                  <td className="py-3 pr-4 text-right font-semibold">{fmtBRLFull(r.receita)}</td>
                  <td className="py-3 pr-4 text-right">{fmtBRLFull(r.ticket)}</td>
                  <td className="py-3 pr-4 text-right text-muted-foreground">{fmtPct(r.pct)}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded ${TIPO_BADGE[r.tipo] ?? ""}`}>{r.tipo}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
