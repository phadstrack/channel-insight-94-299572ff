import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/import")({
  component: ImportPage,
});

function ImportPage() {
  const qc = useQueryClient();

  const { data: meta } = useQuery({
    queryKey: ["meta_pipeline_last_rebuild"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_pipeline")
        .select("v, updated_at")
        .eq("k", "last_rebuild")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: imports } = useQuery({
    queryKey: ["planilha_imports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planilha_imports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rebuild = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("rebuild_core");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Rebuild concluído");
      qc.invalidateQueries();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro no rebuild"),
  });

  const v = (meta?.v ?? {}) as Record<string, unknown>;

  return (
    <div>
      <PageHeader
        title="Importar / Rebuild"
        description="Re-processa o pipeline de leads e vendas a partir dos dados brutos"
        actions={
          <Button onClick={() => rebuild.mutate()} disabled={rebuild.isPending}>
            {rebuild.isPending ? "Rodando..." : "Rodar Rebuild"}
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-semibold mb-3">Último rebuild</h2>
        {!meta ? (
          <p className="text-muted-foreground text-sm">Nunca executado.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <Stat label="Pessoas" value={v.pessoas} />
            <Stat label="Vendas" value={v.vendas} />
            <Stat label="Leads" value={v.leads} />
            <Stat label="Matches" value={v.bridges} />
            <Stat label="Em" value={new Date(meta.updated_at).toLocaleString("pt-BR")} />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Histórico de imports de planilha</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Data</th>
              <th className="text-left px-4 py-2">Aba</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-right px-4 py-2">Inseridas</th>
              <th className="text-right px-4 py-2">Atualizadas</th>
            </tr>
          </thead>
          <tbody>
            {!imports?.length ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Sem registros.</td></tr>
            ) : (
              imports.map((i) => (
                <tr key={i.id} className="border-t border-border/50">
                  <td className="px-4 py-2">{new Date(i.created_at).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2">{i.aba}</td>
                  <td className="px-4 py-2"><Badge variant="outline">{i.status}</Badge></td>
                  <td className="px-4 py-2 text-right">{i.linhas_inseridas}</td>
                  <td className="px-4 py-2 text-right">{i.linhas_atualizadas}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{String(value ?? "—")}</div>
    </div>
  );
}
