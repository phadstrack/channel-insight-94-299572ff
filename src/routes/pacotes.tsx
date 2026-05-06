import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFilters, applyVendasFilters } from "@/lib/filters";
import { PageHeader, Card } from "@/components/dashboard/PageHeader";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { fmtBRL, fmtNum, fmtPct } from "@/lib/format";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

export const Route = createFileRoute("/pacotes")({
  head: () => ({ meta: [{ title: "Pacotes · Febracis MKT" }] }),
  component: Pacotes,
});

const COLORS = ["#cd7f32", "#c0c0c0", "#ffd700", "#b9f2ff", "#7c3aed", "#06b6d4"];

function Pacotes() {
  const { filters } = useFilters();
  const { data } = useQuery({
    queryKey: ["pacotes", filters],
    queryFn: async () => {
      const q = supabase.from("vendas_atribuidas")
        .select("pacote, valor_convertido")
        .limit(20000);
      const { data, error } = await applyVendasFilters(q as any, filters);
      if (error) throw error;
      return (data ?? []) as { pacote: string | null; valor_convertido: number }[];
    },
  });

  const rows = useMemo(() => {
    const m: Record<string, { vendas: number; receita: number }> = {};
    for (const r of data ?? []) {
      const k = r.pacote || "(sem pacote)";
      m[k] = m[k] || { vendas: 0, receita: 0 };
      m[k].vendas += 1;
      m[k].receita += Number(r.valor_convertido ?? 0);
    }
    return Object.entries(m).map(([pacote, v]) => ({
      pacote, ...v, ticket: v.vendas ? v.receita / v.vendas : 0,
    })).sort((a, b) => b.receita - a.receita);
  }, [data]);

  const total = rows.reduce((s, r) => s + r.vendas, 0);

  return (
    <>
      <PageHeader title="Pacotes" subtitle="Distribuição de matrículas e ticket por pacote (Bronze, Diamond, etc.)" />
      <GlobalFilters />
      <Card title="Receita por pacote" className="mb-6">
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="pacote" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtBRL(v as number)} />
              <Tooltip formatter={(v: any) => fmtBRL(Number(v))} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="receita" radius={[6, 6, 0, 0]}>
                {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card title="Detalhamento">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="text-left py-2">Pacote</th>
              <th className="text-right">Vendas</th>
              <th className="text-right">% do total</th>
              <th className="text-right">Receita</th>
              <th className="text-right">Ticket médio</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.pacote} className="border-b border-border/40">
                <td className="py-2 font-medium">{r.pacote}</td>
                <td className="text-right">{fmtNum(r.vendas)}</td>
                <td className="text-right text-muted-foreground">{fmtPct(total ? r.vendas / total : 0)}</td>
                <td className="text-right">{fmtBRL(r.receita)}</td>
                <td className="text-right">{fmtBRL(r.ticket)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
