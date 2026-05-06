import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFilters, applyVendasFilters } from "@/lib/filters";
import { PageHeader, Card } from "@/components/dashboard/PageHeader";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { fmtBRL, fmtNum } from "@/lib/format";

export const Route = createFileRoute("/proprietarios")({
  head: () => ({ meta: [{ title: "Proprietários · Febracis MKT" }] }),
  component: Proprietarios;
});

function Proprietarios() {
  const { filters } = useFilters();
  const { data } = useQuery({
    queryKey: ["proprietarios", filters],
    queryFn: async () => {
      const q = supabase.from("vendas_atribuidas")
        .select("proprietario, valor_convertido, fase")
        .limit(20000);
      const { data, error } = await applyVendasFilters(q as any, filters);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(() => {
    const m: Record<string, { vendas: number; receita: number; aprovadas: number }> = {};
    for (const r of (data as any[]) ?? []) {
      const k = r.proprietario || "(sem proprietário)";
      m[k] = m[k] || { vendas: 0, receita: 0, aprovadas: 0 };
      m[k].vendas += 1;
      m[k].receita += Number(r.valor_convertido ?? 0);
      if ((r.fase || "").toLowerCase() === "aprovada") m[k].aprovadas += 1;
    }
    return Object.entries(m).map(([prop, v]) => ({
      prop, ...v, ticket: v.vendas ? v.receita / v.vendas : 0,
    })).sort((a, b) => b.receita - a.receita);
  }, [data]);

  return (
    <>
      <PageHeader title="Proprietários" subtitle="Performance por responsável de venda" />
      <GlobalFilters />
      <Card title={`${rows.length} proprietários`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left py-2">Proprietário</th>
                <th className="text-right">Vendas</th>
                <th className="text-right">Aprovadas</th>
                <th className="text-right">Receita</th>
                <th className="text-right">Ticket</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((r) => (
                <tr key={r.prop} className="border-b border-border/40">
                  <td className="py-2">{r.prop}</td>
                  <td className="text-right">{fmtNum(r.vendas)}</td>
                  <td className="text-right text-emerald-500">{fmtNum(r.aprovadas)}</td>
                  <td className="text-right">{fmtBRL(r.receita)}</td>
                  <td className="text-right text-muted-foreground">{fmtBRL(r.ticket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
