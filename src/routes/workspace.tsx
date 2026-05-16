import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/workspace")({
  component: WorkspacePage,
});

function WorkspacePage() {
  const { clientId } = useAuth();

  const { data: audits, isLoading } = useQuery({
    queryKey: ["client_audits", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("arc3_audits")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minhas Auditorias</h1>
        <p className="text-muted-foreground mt-1">Acompanhe suas auditorias de marketing</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : audits && audits.length > 0 ? (
          <div className="space-y-2">
            {audits.map((audit: any) => (
              <div key={audit.id} className="flex justify-between items-center p-3 rounded border border-border/50 hover:bg-accent/50">
                <div>
                  <p className="font-medium">{audit.client_name}</p>
                  <p className="text-sm text-muted-foreground">{audit.audit_period_start}</p>
                </div>
                <span className="text-sm font-medium">{audit.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhuma auditoria disponível</p>
        )}
      </div>
    </div>
  );
}
