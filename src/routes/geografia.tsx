import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/geografia")({
  component: GeografiaPage,
});

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function GeografiaPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["geografia_estados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas_atribuidas")
        .select("estado, valor_convertido")
        .not("estado", "is", null)
        .limit(5000);
      if (error) throw error;
      const agg = new Map<string, { vendas: number; receita: number }>();
      for (const row of data ?? []) {
        const uf = row.estado ?? "—";
        const cur = agg.get(uf) ?? { vendas: 0, receita: 0 };
        cur.vendas += 1;
        cur.receita += Number(row.valor_convertido ?? 0);
        agg.set(uf, cur);
      }
      return [...agg.entries()]
        .map(([estado, v]) => ({ estado, ...v }))
        .sort((a, b) => b.receita - a.receita);
    },
  });

  return (
    <div>
      <PageHeader title="Geografia" description="Distribuição de vendas por estado" />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">UF</th>
              <th className="text-right px-4 py-3">Vendas</th>
              <th className="text-right px-4 py-3">Receita</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Carregando...</td></tr>
            ) : !data?.length ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Sem dados.</td></tr>
            ) : (
              data.map((e) => (
                <tr key={e.estado} className="border-t border-border/50">
                  <td className="px-4 py-3 font-medium">{e.estado}</td>
                  <td className="px-4 py-3 text-right">{e.vendas.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right">{fmtBRL(e.receita)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
