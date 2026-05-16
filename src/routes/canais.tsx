import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/canais")({
  component: CanaisPage,
});

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function CanaisPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["canais_full"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_canais_breakdown", {});
      if (error) throw error;
      return data ?? [];
    },
  });

  const total = (data ?? []).reduce((s, x) => s + Number(x.receita ?? 0), 0) || 1;

  return (
    <div>
      <PageHeader title="Canais" description="Desempenho por canal de aquisição" />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Canal</th>
              <th className="text-right px-4 py-3">Vendas</th>
              <th className="text-right px-4 py-3">Receita</th>
              <th className="text-right px-4 py-3">Ticket Médio</th>
              <th className="text-right px-4 py-3">% Receita</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Carregando...</td></tr>
            ) : !data?.length ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Sem dados.</td></tr>
            ) : (
              data.map((c) => (
                <tr key={c.canal} className="border-t border-border/50">
                  <td className="px-4 py-3 font-medium">{c.canal}</td>
                  <td className="px-4 py-3 text-right">{Number(c.vendas).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right">{fmtBRL(Number(c.receita ?? 0))}</td>
                  <td className="px-4 py-3 text-right">{fmtBRL(Number(c.ticket ?? 0))}</td>
                  <td className="px-4 py-3 text-right">{((Number(c.receita ?? 0) / total) * 100).toFixed(1)}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
