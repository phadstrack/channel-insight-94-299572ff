import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/auditoria")({
  component: AuditoriaPage,
});

const sevColor: Record<string, string> = {
  error: "bg-red-500/15 text-red-400 border-red-500/30",
  warn: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

function AuditoriaPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dq_findings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dq_findings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader title="Auditoria de Dados" description="Achados de qualidade do último rebuild" />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Severidade</th>
              <th className="text-left px-4 py-3">Entidade</th>
              <th className="text-left px-4 py-3">Regra</th>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Carregando...</td></tr>
            ) : !data?.length ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">Sem findings.</td></tr>
            ) : (
              data.map((f) => (
                <tr key={f.id} className="border-t border-border/50 align-top">
                  <td className="px-4 py-2">
                    <Badge variant="outline" className={sevColor[f.severity] ?? ""}>{f.severity}</Badge>
                  </td>
                  <td className="px-4 py-2">{f.entity}</td>
                  <td className="px-4 py-2 font-mono text-xs">{f.rule}</td>
                  <td className="px-4 py-2 font-mono text-xs">{f.entity_id}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground max-w-md truncate">
                    {f.details ? JSON.stringify(f.details) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
