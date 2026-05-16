import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/conta")({
  component: ContaPage,
});

function ContaPage() {
  const { user, role, clientId, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minha Conta</h1>
        <p className="text-muted-foreground mt-1">Gerenciar informações da conta</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">E-mail</label>
          <p className="text-lg mt-1">{user?.email}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Perfil</label>
          <p className="text-lg mt-1 capitalize">{role === "admin" ? "Auditor" : "Cliente"}</p>
        </div>

        {role === "client" && clientId && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Workspace ID</label>
            <p className="text-sm font-mono mt-1 bg-muted p-2 rounded">{clientId}</p>
          </div>
        )}
      </div>

      <Button onClick={handleSignOut} variant="destructive" className="w-full">
        Sair
      </Button>
    </div>
  );
}
