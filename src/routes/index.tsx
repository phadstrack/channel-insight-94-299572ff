import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KpiCard } from "@/components/dashboard/KpiCard";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { role } = useAuth();

  if (role === "client") {
    return <ClientDashboard />;
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const { data: audits, isLoading } = useQuery({
    queryKey: ["arc3_audits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arc3_audits")
        .select("*, arc3_clients(name), arc3_findings(count), arc3_recommendations(count)")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["arc3_clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("arc3_clients")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral de suas auditorias</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Total de Clientes" value={clients?.length ?? 0} accent="#6366f1" />
        <KpiCard label="Auditorias Ativas" value={audits?.filter(a => a.status === "in_progress").length ?? 0} accent="#8b5cf6" />
        <KpiCard label="Auditorias Completas" value={audits?.filter(a => a.status === "completed").length ?? 0} accent="#10b981" />
        <KpiCard label="Total de Findings" value={audits?.reduce((sum, a) => sum + (a.arc3_findings?.length ?? 0), 0) ?? 0} accent="#ef4444" />
      </div>

      {/* Recent Audits */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Auditorias Recentes</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : audits && audits.length > 0 ? (
          <div className="space-y-2">
            {audits.map((audit: any) => (
              <div key={audit.id} className="flex justify-between items-start p-3 rounded border border-border/50 hover:bg-accent/50 transition">
                <div>
                  <p className="font-medium">{audit.arc3_clients?.name || "Sem cliente"}</p>
                  <p className="text-sm text-muted-foreground">{audit.audit_period_start}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">{audit.status}</span>
                  <p className="text-sm text-muted-foreground">{audit.arc3_findings?.length ?? 0} findings</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhuma auditoria criada ainda</p>
        )}
      </div>
    </div>
  );
}

function ClientDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo</h1>
        <p className="text-muted-foreground mt-1">Acesse suas auditorias no menu lateral</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 max-w-lg">
        <h2 className="text-lg font-semibold mb-2">Próximos Passos</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Visualize suas auditorias no menu "Minhas Auditorias"</li>
          <li>• Consulte os findings e recomendações de cada auditoria</li>
          <li>• Baixe os relatórios em PDF (em breve)</li>
        </ul>
      </div>
    </div>
  );
}
