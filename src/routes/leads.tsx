import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/leads")({
  component: LeadsPage,
});

function LeadsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data: totalLeads, isLoading: lk1 } = useQuery({
    queryKey: ["leads_total"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("fct_lead")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: leadsConvertidos, isLoading: lk2 } = useQuery({
    queryKey: ["leads_convertidos"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("bridge_lead_venda")
        .select("lead_id", { count: "exact", head: true })
        .eq("is_primary", true);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["fct_lead", search, page],
    queryFn: async () => {
      let q = supabase
        .from("fct_lead")
        .select("lead_id, nome, email, telefone, canal, origem_lead, data_lead", { count: "exact" })
        .order("data_lead", { ascending: false, nullsFirst: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);
      if (search) {
        q = q.or(`nome.ilike.%${search}%,email.ilike.%${search}%`);
      }
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const taxaConv =
    totalLeads && totalLeads > 0 ? ((leadsConvertidos ?? 0) / totalLeads) * 100 : 0;

  return (
    <div>
      <PageHeader title="Leads" description="Leads capturados e taxa de conversão para venda" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Total de Leads" value={(totalLeads ?? 0).toLocaleString("pt-BR")} accent="#10b981" loading={lk1} />
        <KpiCard label="Leads que Viraram Venda" value={(leadsConvertidos ?? 0).toLocaleString("pt-BR")} accent="#6366f1" loading={lk2} />
        <KpiCard label="Taxa de Conversão" value={`${taxaConv.toFixed(1)}%`} accent="#f59e0b" loading={lk1 || lk2} />
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => { setPage(0); setSearch(e.target.value); }}
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
                <th className="text-left px-4 py-3">E-mail</th>
                <th className="text-left px-4 py-3">Canal</th>
                <th className="text-left px-4 py-3">Origem</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Carregando...</td></tr>
              ) : !data?.rows.length ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Nenhum lead.</td></tr>
              ) : (
                data.rows.map((l) => (
                  <tr key={l.lead_id} className="border-t border-border/50 hover:bg-accent/30">
                    <td className="px-4 py-2">{l.data_lead ? new Date(l.data_lead).toLocaleDateString("pt-BR") : "—"}</td>
                    <td className="px-4 py-2">{l.nome ?? "—"}</td>
                    <td className="px-4 py-2">{l.email ?? "—"}</td>
                    <td className="px-4 py-2">{l.canal ?? "—"}</td>
                    <td className="px-4 py-2">{l.origem_lead ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{data?.count ?? 0} leads</span>
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
