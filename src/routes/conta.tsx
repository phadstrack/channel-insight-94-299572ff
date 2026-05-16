import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/conta")({
  component: ContaPage,
});

function ContaPage() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setNome(profile.nome ?? "");
      setTelefone(profile.telefone ?? "");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ nome, telefone })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="max-w-lg">
      <PageHeader title="Minha Conta" />

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <Label className="text-xs">E-mail</Label>
          <p className="text-sm mt-1">{user?.email}</p>
        </div>
        <div>
          <Label className="text-xs">Perfil</Label>
          <p className="text-sm mt-1">{role === "admin" ? "Administrador" : "Usuário"}</p>
        </div>
        <div>
          <Label className="text-xs">Nome</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Telefone</Label>
          <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="mt-1" />
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
          {save.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <Button
        onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
        variant="destructive"
        className="w-full mt-4"
      >
        Sair
      </Button>
    </div>
  );
}
