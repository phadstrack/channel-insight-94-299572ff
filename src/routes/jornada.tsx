import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFilters, applyVendasFilters } from "@/lib/filters";
import { PageHeader, Card } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { fmtNum, fmtPct, channelColor, CHANNEL_COLORS } from "@/lib/format";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend } from "recharts";

export const Route = createFileRoute("/jornada")({
  head: () => ({
    meta: [
      { title: "Jornada do Lead · Febracis MKT" },
      { name: "description", content: "Comportamento multi-toque dos leads antes da compra." },
    ],
  }),
  component: Jornada,
});

function Jornada() {
  const { filters } = useFilters();

  // get vendas_atribuidas to count touches via separate query of jornada_normalizada
  const { data: vendas } = useQuery({
    queryKey: ["jornada-vendas", filters],
    queryFn: async () => {
      const q = supabase
        .from("vendas_atribuidas")
        .select("email, turma, tipo_atribuicao")
        .limit(10000);
      const { data, error } = await applyVendasFilters(q as any, filters);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: jornada, isLoading } = useQuery({
    queryKey: ["jornada-all", filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jornada_normalizada")
        .select("email, turma, toque_num, tipo, dias_antes_compra, canal_normalizado")
        .limit(10000);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const v = vendas ?? [];
  const j = jornada ?? [];

  // Filter jornada by sales matching filters (same email+turma)
  const vKeys = new Set(v.map((r) => `${r.email}|${r.turma}`));
  const jFiltered = j.filter((r) => vKeys.has(`${r.email}|${r.turma}`));

  // Count touches per sale
  const touchCount: Record<string, number> = {};
  for (const r of jFiltered) {
    if (r.tipo === "SEM LEAD") continue;
    const k = `${r.email}|${r.turma}`;
    touchCount[k] = (touchCount[k] ?? 0) + 1;
  }
  const single = Object.values(touchCount).filter((c) => c === 1).length;
  const multi = Object.values(touchCount).filter((c) => c >= 2).length;
  const semLead = v.filter((r) => r.tipo_atribuicao === "Sem Atribuicao").length;
  const totalSales = v.length || 1;

  // Days histogram
  const buckets = [
    { label: "0-7", min: 0, max: 7 },
    { label: "8-14", min: 8, max: 14 },
    { label: "15-30", min: 15, max: 30 },
    { label: "31-60", min: 31, max: 60 },
    { label: "61-90", min: 61, max: 90 },
    { label: "91-180", min: 91, max: 180 },
    { label: "181-365", min: 181, max: 365 },
    { label: "365+", min: 366, max: Infinity },
  ];
  const histo = buckets.map((b) => {
    const count = jFiltered.filter(
      (r) => r.tipo !== "SEM LEAD" && r.dias_antes_compra != null && r.dias_antes_compra >= b.min && r.dias_antes_compra <= b.max,
    ).length;
    return { label: b.label, leads: count };
  });

  // First vs Last touch comparison
  const firstByKey: Record<string, string> = {};
  const lastByKey: Record<string, string> = {};
  for (const r of jFiltered) {
    const k = `${r.email}|${r.turma}`;
    if (r.tipo === "Primeiro Toque") firstByKey[k] = r.canal_normalizado;
    if (r.tipo === "Último Toque" || r.tipo === "Ultimo Toque") lastByKey[k] = r.canal_normalizado;
  }
  const compareMap: Record<string, { same: number; diff: number }> = {};
  let totalCompared = 0;
  let totalChanged = 0;
  for (const k of Object.keys(firstByKey)) {
    const fc = firstByKey[k];
    const lc = lastByKey[k];
    if (!fc || !lc) continue;
    totalCompared++;
    if (fc === lc) totalChanged += 0;
    else totalChanged++;
    const key = `${fc} → ${lc}`;
    compareMap[key] = compareMap[key] || { same: 0, diff: 0 };
    if (fc === lc) compareMap[key].same++;
    else compareMap[key].diff++;
  }
  const transitions = Object.entries(compareMap)
    .map(([k, v]) => ({ par: k, count: v.same + v.diff }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Canal por tipo de toque (stacked)
  const canaisSet = new Set<string>();
  const stack: Record<string, Record<string, number>> = {};
  for (const r of jFiltered) {
    if (r.tipo === "SEM LEAD") continue;
    const c = r.canal_normalizado || "Outro";
    canaisSet.add(c);
    stack[c] = stack[c] || { Primeiro: 0, Intermediario: 0, Ultimo: 0, Unico: 0 };
    if (r.tipo === "Primeiro Toque") stack[c].Primeiro++;
    else if (r.tipo === "Intermediário" || r.tipo === "Intermediario") stack[c].Intermediario++;
    else if (r.tipo === "Último Toque" || r.tipo === "Ultimo Toque") stack[c].Ultimo++;
    else if (r.tipo === "Único" || r.tipo === "Unico") stack[c].Unico++;
  }
  const stackData = Array.from(canaisSet).map((c) => ({ canal: c, ...stack[c] }));

  return (
    <>
      <PageHeader title="Jornada do Lead" subtitle="Comportamento multi-toque antes da compra" />
      <GlobalFilters />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard
          label="Vendas com toque único"
          value={fmtNum(single)}
          hint={fmtPct((single / totalSales) * 100)}
          accent="#a78bfa"
          loading={isLoading}
        />
        <KpiCard
          label="Vendas com 2+ toques"
          value={fmtNum(multi)}
          hint={fmtPct((multi / totalSales) * 100)}
          accent="#6366f1"
          loading={isLoading}
        />
        <KpiCard
          label="Vendas sem lead"
          value={fmtNum(semLead)}
          hint={fmtPct((semLead / totalSales) * 100)}
          accent="#f87171"
          loading={isLoading}
        />
      </div>

      <Card title="Dias até a conversão" className="mb-6">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histo} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
              <XAxis dataKey="label" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [fmtNum(Number(v)), "Leads"]}
              />
              <Bar dataKey="leads" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Canal por tipo de toque">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
                <XAxis dataKey="canal" stroke="#9ca3af" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Primeiro" stackId="a" fill="#a78bfa" />
                <Bar dataKey="Intermediario" stackId="a" fill="#8b5cf6" />
                <Bar dataKey="Ultimo" stackId="a" fill="#6366f1" />
                <Bar dataKey="Unico" stackId="a" fill="#4338ca" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Transições primeiro → último toque">
          <div className="text-xs text-muted-foreground mb-3">
            {fmtNum(totalCompared)} jornadas com 2+ toques · {fmtPct(totalCompared > 0 ? (totalChanged / totalCompared) * 100 : 0)} mudaram de canal
          </div>
          <div className="overflow-y-auto max-h-64">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="py-2">Transição</th>
                  <th className="py-2 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {transitions.length === 0 && (
                  <tr><td colSpan={2} className="py-6 text-center text-muted-foreground">Sem dados</td></tr>
                )}
                {transitions.map((t) => (
                  <tr key={t.par} className="border-b border-border/40">
                    <td className="py-2">{t.par}</td>
                    <td className="py-2 text-right font-medium">{fmtNum(t.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
