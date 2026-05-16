import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/")({
  component: VisaoGeralPage,
});

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function VisaoGeralPage() {
  const { data: agg, isLoading: l1 } = useQuery({
    queryKey: ["vendas_agg"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_vendas_agg", {});
      if (error) throw error;
      return data?.[0] ?? { total_count: 0, receita_sum: 0, com_lead_count: 0 };
    },
  });

  const { data: leadsCount, isLoading: l2 } = useQuery({
    queryKey: ["leads_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("fct_lead")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: canais, isLoading: l3 } = useQuery({
    queryKey: ["canais_breakdown"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_canais_breakdown", {});
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalVendas = Number(agg?.total_count ?? 0);
  const receita = Number(agg?.receita_sum ?? 0);
  const comLead = Number(agg?.com_lead_count ?? 0);
  const taxaLead = totalVendas > 0 ? (comLead / totalVendas) * 100 : 0;

  return (
    <div>
      <PageHeader title="Visão Geral" description="Métricas consolidadas de vendas, leads e canais" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Receita Total" value={fmtBRL(receita)} accent="#6366f1" loading={l1} />
        <KpiCard label="Vendas" value={totalVendas.toLocaleString("pt-BR")} accent="#8b5cf6" loading={l1} />
        <KpiCard label="Leads" value={(leadsCount ?? 0).toLocaleString("pt-BR")} accent="#10b981" loading={l2} />
        <KpiCard label="% Vendas com Lead" value={`${taxaLead.toFixed(1)}%`} accent="#f59e0b" loading={l1} />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Receita por Canal</h2>
        {l3 ? (
          <p className="text-muted-foreground text-sm">Carregando...</p>
        ) : !canais || canais.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem dados.</p>
        ) : (
          <div className="space-y-2">
            {canais.map((c) => {
              const total = canais.reduce((s, x) => s + Number(x.receita ?? 0), 0) || 1;
              const pct = (Number(c.receita ?? 0) / total) * 100;
              return (
                <div key={c.canal} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{c.canal}</span>
                    <span className="text-muted-foreground">
                      {fmtBRL(Number(c.receita ?? 0))} · {Number(c.vendas).toLocaleString("pt-BR")} vendas
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
