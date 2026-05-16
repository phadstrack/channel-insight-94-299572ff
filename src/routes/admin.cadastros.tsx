import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cadastros")({
  component: CadastrosPage,
});

function CadastrosPage() {
  return (
    <div>
      <PageHeader title="Cadastros" description="Gerencie produtos, edições, contas, orçamentos e regras" />
      <Tabs defaultValue="produtos">
        <TabsList>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="edicoes">Edições</TabsTrigger>
          <TabsTrigger value="contas">Contas</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
          <TabsTrigger value="regras">Regras</TabsTrigger>
        </TabsList>
        <TabsContent value="produtos"><Produtos /></TabsContent>
        <TabsContent value="edicoes"><Edicoes /></TabsContent>
        <TabsContent value="contas"><Contas /></TabsContent>
        <TabsContent value="orcamentos"><Orcamentos /></TabsContent>
        <TabsContent value="regras"><Regras /></TabsContent>
      </Tabs>
    </div>
  );
}

function useTable<T>(table: "produtos" | "edicoes" | "contas" | "orcamentos" | "regras_classificacao") {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").limit(500);
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [table] }); toast.success("Removido"); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  return { ...q, remove };
}

function Produtos() {
  const { data, isLoading, remove } = useTable<{ id: string; nome_produto: string; abreviacao: string; cor_hex: string }>("produtos");
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [abrev, setAbrev] = useState("");
  const [cor, setCor] = useState("#1E40AF");

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("produtos").insert({ nome_produto: nome, abreviacao: abrev, cor_hex: cor });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["produtos"] }); setNome(""); setAbrev(""); toast.success("Adicionado"); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <Section>
      <div className="flex gap-2 mb-4">
        <Input placeholder="Nome do produto" value={nome} onChange={(e) => setNome(e.target.value)} />
        <Input placeholder="Abrev." value={abrev} onChange={(e) => setAbrev(e.target.value)} className="w-32" />
        <Input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="w-16 p-1" />
        <Button onClick={() => add.mutate()} disabled={!nome || !abrev || add.isPending}>Adicionar</Button>
      </div>
      <SimpleTable
        headers={["Cor", "Nome", "Abrev.", ""]}
        rows={(data ?? []).map((p) => [
          <span key="c" className="inline-block size-4 rounded" style={{ background: p.cor_hex }} />,
          p.nome_produto,
          p.abreviacao,
          <Button key="d" variant="ghost" size="sm" onClick={() => remove.mutate(p.id)}>Remover</Button>,
        ])}
        loading={isLoading}
      />
    </Section>
  );
}

function Edicoes() {
  const { data, isLoading, remove } = useTable<{ id: string; nome_edicao: string; produto_id: string; valor_aprovado: number; data_inicio: string | null; data_fim: string | null }>("edicoes");
  const { data: produtos } = useQuery({
    queryKey: ["produtos_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("id, nome_produto");
      if (error) throw error;
      return data ?? [];
    },
  });
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [valor, setValor] = useState("0");

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("edicoes").insert({ nome_edicao: nome, produto_id: produtoId, valor_aprovado: Number(valor) });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["edicoes"] }); setNome(""); toast.success("Adicionado"); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <Section>
      <div className="flex gap-2 mb-4">
        <Input placeholder="Nome da edição" value={nome} onChange={(e) => setNome(e.target.value)} />
        <select className="rounded-md border border-border bg-background px-3 text-sm" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
          <option value="">Produto...</option>
          {(produtos ?? []).map((p) => <option key={p.id} value={p.id}>{p.nome_produto}</option>)}
        </select>
        <Input placeholder="Valor" type="number" value={valor} onChange={(e) => setValor(e.target.value)} className="w-32" />
        <Button onClick={() => add.mutate()} disabled={!nome || !produtoId || add.isPending}>Adicionar</Button>
      </div>
      <SimpleTable
        headers={["Nome", "Valor", "Início", "Fim", ""]}
        rows={(data ?? []).map((e) => [
          e.nome_edicao,
          e.valor_aprovado,
          e.data_inicio ?? "—",
          e.data_fim ?? "—",
          <Button key="d" variant="ghost" size="sm" onClick={() => remove.mutate(e.id)}>Remover</Button>,
        ])}
        loading={isLoading}
      />
    </Section>
  );
}

function Contas() {
  const { data, isLoading, remove } = useTable<{ id: string; nome_conta: string }>("contas");
  const qc = useQueryClient();
  const [nome, setNome] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contas").insert({ nome_conta: nome });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contas"] }); setNome(""); toast.success("Adicionado"); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <Section>
      <div className="flex gap-2 mb-4">
        <Input placeholder="Nome da conta" value={nome} onChange={(e) => setNome(e.target.value)} />
        <Button onClick={() => add.mutate()} disabled={!nome || add.isPending}>Adicionar</Button>
      </div>
      <SimpleTable
        headers={["Nome", ""]}
        rows={(data ?? []).map((c) => [
          c.nome_conta,
          <Button key="d" variant="ghost" size="sm" onClick={() => remove.mutate(c.id)}>Remover</Button>,
        ])}
        loading={isLoading}
      />
    </Section>
  );
}

function Orcamentos() {
  const { data, isLoading, remove } = useTable<{ id: string; produto_id: string; mes_referencia: string; valor_aprovado: number }>("orcamentos");
  const { data: produtos } = useQuery({
    queryKey: ["produtos_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("id, nome_produto");
      if (error) throw error;
      return data ?? [];
    },
  });
  const qc = useQueryClient();
  const [produtoId, setProdutoId] = useState("");
  const [mes, setMes] = useState("");
  const [valor, setValor] = useState("0");

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("orcamentos").insert({ produto_id: produtoId, mes_referencia: mes, valor_aprovado: Number(valor) });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orcamentos"] }); setMes(""); toast.success("Adicionado"); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const produtoNome = (id: string) => produtos?.find((p) => p.id === id)?.nome_produto ?? id;

  return (
    <Section>
      <div className="flex gap-2 mb-4">
        <select className="rounded-md border border-border bg-background px-3 text-sm" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
          <option value="">Produto...</option>
          {(produtos ?? []).map((p) => <option key={p.id} value={p.id}>{p.nome_produto}</option>)}
        </select>
        <Input placeholder="Mês (ex: 2026-05)" value={mes} onChange={(e) => setMes(e.target.value)} className="w-40" />
        <Input placeholder="Valor" type="number" value={valor} onChange={(e) => setValor(e.target.value)} className="w-32" />
        <Button onClick={() => add.mutate()} disabled={!produtoId || !mes || add.isPending}>Adicionar</Button>
      </div>
      <SimpleTable
        headers={["Produto", "Mês", "Valor", ""]}
        rows={(data ?? []).map((o) => [
          produtoNome(o.produto_id),
          o.mes_referencia,
          o.valor_aprovado,
          <Button key="d" variant="ghost" size="sm" onClick={() => remove.mutate(o.id)}>Remover</Button>,
        ])}
        loading={isLoading}
      />
    </Section>
  );
}

function Regras() {
  const { data, isLoading, remove } = useTable<{ id: string; produto_id: string; coluna: string; operador: string; valor: string; prioridade: number }>("regras_classificacao");
  const { data: produtos } = useQuery({
    queryKey: ["produtos_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("id, nome_produto");
      if (error) throw error;
      return data ?? [];
    },
  });
  const qc = useQueryClient();
  const [produtoId, setProdutoId] = useState("");
  const [coluna, setColuna] = useState("turma");
  const [operador, setOperador] = useState("contem");
  const [valor, setValor] = useState("");
  const [prio, setPrio] = useState("0");

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("regras_classificacao").insert({
        produto_id: produtoId, coluna, operador, valor, prioridade: Number(prio),
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["regras_classificacao"] }); setValor(""); toast.success("Adicionado"); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const produtoNome = (id: string) => produtos?.find((p) => p.id === id)?.nome_produto ?? id;

  return (
    <Section>
      <div className="flex flex-wrap gap-2 mb-4">
        <select className="rounded-md border border-border bg-background px-3 text-sm" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
          <option value="">Produto...</option>
          {(produtos ?? []).map((p) => <option key={p.id} value={p.id}>{p.nome_produto}</option>)}
        </select>
        <Input placeholder="Coluna" value={coluna} onChange={(e) => setColuna(e.target.value)} className="w-32" />
        <select className="rounded-md border border-border bg-background px-3 text-sm" value={operador} onChange={(e) => setOperador(e.target.value)}>
          <option value="contem">contém</option>
          <option value="igual">igual</option>
          <option value="comeca_com">começa com</option>
          <option value="regex">regex</option>
        </select>
        <Input placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} />
        <Input placeholder="Prio" type="number" value={prio} onChange={(e) => setPrio(e.target.value)} className="w-20" />
        <Button onClick={() => add.mutate()} disabled={!produtoId || !valor || add.isPending}>Adicionar</Button>
      </div>
      <SimpleTable
        headers={["Produto", "Coluna", "Operador", "Valor", "Prio", ""]}
        rows={(data ?? []).map((r) => [
          produtoNome(r.produto_id),
          r.coluna,
          r.operador,
          r.valor,
          r.prioridade,
          <Button key="d" variant="ghost" size="sm" onClick={() => remove.mutate(r.id)}>Remover</Button>,
        ])}
        loading={isLoading}
      />
    </Section>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 rounded-xl border border-border bg-card p-6">{children}</div>;
}

function SimpleTable({
  headers,
  rows,
  loading,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  loading?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>{headers.map((h, i) => <th key={i} className="text-left px-4 py-2">{h}</th>)}</tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={headers.length} className="px-4 py-6 text-center text-muted-foreground">Carregando...</td></tr>
          ) : rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="px-4 py-6 text-center text-muted-foreground">Sem registros.</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t border-border/50">
                {r.map((c, j) => <td key={j} className="px-4 py-2">{c}</td>)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
