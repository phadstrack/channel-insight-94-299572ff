import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFilters, applyVendasFilters } from "@/lib/filters";
import { PageHeader, Card } from "@/components/dashboard/PageHeader";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { fmtBRL, fmtNum, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/origem")({
  head: () => ({ meta: [{ title: "Origem do Lead · Febracis MKT" }] }),
  component: Origem,
});

function Origem() {
  const { filters } = useFilters();
  const { data } = useQuery({
    queryKey: ["origem", filters],
    queryFn: async () => {
      const q = supabase.from("vendas_atribuidas")
        .select("origem_lead, ultima_origem_lead, valor_convertido")
        .limit(20000);
      const { data, error } = await applyVendasFilters(q as any, filters);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => {
    const m: Record<string, { vendas: number; receita: number }> = {};
    for (const r of (data as any[]) ?? []) {
      const k = r.origem_lead || "(sem origem)";
      m[k] = m[k] || { vendas: 0, receita: 0 };
      m[k].vendas += 1;
      m[k].receita += Number(r.valor_convertido ?? 0);
    }
    return Object.entries(m).map(([origem, v]) => ({ origem, ...v }))
      .sort((a, b) => b.vendas - a.vendas);
  }, [data]);

  const total = rows.reduce((s, r) => s + r.vendas, 0);
  const totalReceita = rows.reduce((s, r) => s + r.receita, 0);

  return (
    <>
      <PageHeader title="Origem do Lead" subtitle="De onde vêm as matrículas (Indicação, Social Seller, Marketing, LPs…)" />
      <GlobalFilters />
      <Card title={`${rows.length} origens · ${fmtNum(total)} vendas · ${fmtBRL(totalReceita)}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left py-2">Origem do lead</th>
                <th className="text-right">Vendas</th>
                <th className="text-right">% vendas</th>
                <th className="text-right">Receita</th>
                <th className="text-right">% receita</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.origem} className="border-b border-border/40">
                  <td className="py-2 font-medium">{r.origem}</td>
                  <td className="text-right">{fmtNum(r.vendas)}</td>
                  <td className="text-right text-muted-foreground">{fmtPct(total ? r.vendas / total : 0)}</td>
                  <td className="text-right">{fmtBRL(r.receita)}</td>
                  <td className="text-right text-muted-foreground">{fmtPct(totalReceita ? r.receita / totalReceita : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
