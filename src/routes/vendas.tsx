import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/vendas")({
  component: VendasPage,
});

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function VendasPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["vendas_atribuidas", search, page],
    queryFn: async () => {
      let q = supabase
        .from("vendas_atribuidas")
        .select("*", { count: "exact" })
        .order("data_matricula", { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);
      if (search) {
        q = q.or(`nome.ilike.%${search}%,email.ilike.%${search}%`);
      }
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  return (
    <div>
      <PageHeader title="Vendas" description="Vendas atribuídas com canal e origem" />

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => {
            setPage(0);
            setSearch(e.target.value);
          }}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Turma</th>
                <th className="text-left px-4 py-3">Canal</th>
                <th className="text-left px-4 py-3">UF</th>
                <th className="text-right px-4 py-3">Valor</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Carregando...</td></tr>
              ) : !data?.rows.length ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Nenhuma venda.</td></tr>
              ) : (
                data.rows.map((v, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-accent/30">
                    <td className="px-4 py-2">{v.data_matricula ?? "—"}</td>
                    <td className="px-4 py-2">{v.nome ?? "—"}</td>
                    <td className="px-4 py-2">{v.turma ?? "—"}</td>
                    <td className="px-4 py-2">{v.canal ?? "—"}</td>
                    <td className="px-4 py-2">{v.estado ?? "—"}</td>
                    <td className="px-4 py-2 text-right">{fmtBRL(Number(v.valor_convertido ?? 0))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{data?.count ?? 0} vendas</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data || (page + 1) * pageSize >= (data.count ?? 0)}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
