import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listWorkspaces, createWorkspace } from "@/lib/bi-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/dashboard/PageHeader";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Plus, FolderOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/workspaces")({
  head: () => ({ meta: [{ title: "Workspaces · BI" }] }),
  component: WorkspacesPage,
});

function WorkspacesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const { data: items = [], isLoading } = useQuery({ queryKey: ["bi-workspaces"], queryFn: listWorkspaces });
  const create = useMutation({
    mutationFn: () => createWorkspace(name.trim()),
    onSuccess: (ws) => {
      toast.success("Workspace criado");
      setName("");
      qc.invalidateQueries({ queryKey: ["bi-workspaces"] });
      navigate({ to: "/app/w/$wid/sources", params: { wid: ws.id } });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar"),
  });

  return (
    <>
      <PageHeader title="BI · Workspaces" subtitle="Cada workspace é um espaço isolado de dados, modelos e painéis." tutorialKey="workspaces" />
      <Card title="Criar workspace">
        <div className="flex gap-2">
          <Input placeholder="Ex.: Febracis, Cliente X..." value={name} onChange={(e) => setName(e.target.value)} />
          <Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate()}>
            <Plus className="size-4" /> Criar
          </Button>
        </div>
      </Card>
      <Card title="Seus workspaces">
        {isLoading ? <div className="text-sm text-muted-foreground">Carregando...</div> : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhum workspace ainda. Crie o primeiro acima.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(w => (
              <Link key={w.id} to="/app/w/$wid/sources" params={{ wid: w.id }}
                className="rounded-lg border border-border p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-2"><FolderOpen className="size-4 text-primary" /><span className="font-medium">{w.name}</span></div>
                <div className="mt-2 text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString("pt-BR")}</div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
