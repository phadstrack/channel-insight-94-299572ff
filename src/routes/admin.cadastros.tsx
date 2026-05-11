import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, Card } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/cadastros")({
  head: () => ({ meta: [{ title: "Cadastros · Febracis MKT" }] }),
  component: CadastrosPage,
});

type FieldType = "text" | "number" | "date" | "color" | "boolean" | "select";
type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  optionsFrom?: "produtos" | "edicoes";
};
type EntityDef = {
  table: "produtos" | "contas" | "edicoes" | "orcamentos" | "regras_classificacao";
  label: string;
  orderBy: string;
  orderAsc?: boolean;
  columns: { key: string; label: string; render?: (row: any) => React.ReactNode }[];
  fields: FieldDef[];
};

const ENTITIES: EntityDef[] = [
  {
    table: "produtos",
    label: "Produtos",
    orderBy: "nome_produto",
    orderAsc: true,
    columns: [
      { key: "nome_produto", label: "Nome" },
      { key: "abreviacao", label: "Abrev." },
      {
        key: "cor_hex",
        label: "Cor",
        render: (r) => (
          <div className="flex items-center gap-2">
            <span className="size-4 rounded border border-border" style={{ background: r.cor_hex }} />
            <span className="text-xs font-mono">{r.cor_hex}</span>
          </div>
        ),
      },
      { key: "edicao_anual_unica", label: "Anual única", render: (r) => (r.edicao_anual_unica ? "Sim" : "Não") },
    ],
    fields: [
      { key: "nome_produto", label: "Nome do produto", type: "text", required: true },
      { key: "abreviacao", label: "Abreviação", type: "text", required: true },
      { key: "cor_hex", label: "Cor (hex)", type: "color", required: true },
      { key: "edicao_anual_unica", label: "Edição anual única", type: "boolean" },
    ],
  },
  {
    table: "contas",
    label: "Contas",
    orderBy: "nome_conta",
    orderAsc: true,
    columns: [
      { key: "nome_conta", label: "Nome" },
      { key: "produto_principal_id", label: "Produto principal" },
    ],
    fields: [
      { key: "nome_conta", label: "Nome da conta", type: "text", required: true },
      { key: "produto_principal_id", label: "Produto principal", type: "select", optionsFrom: "produtos" },
    ],
  },
  {
    table: "edicoes",
    label: "Edições",
    orderBy: "data_inicio",
    orderAsc: false,
    columns: [
      { key: "nome_edicao", label: "Nome" },
      { key: "produto_id", label: "Produto" },
      { key: "data_inicio", label: "Início" },
      { key: "data_fim", label: "Fim" },
      { key: "valor_aprovado", label: "Valor aprovado", render: (r) => fmtBRL(r.valor_aprovado) },
    ],
    fields: [
      { key: "nome_edicao", label: "Nome da edição", type: "text", required: true },
      { key: "produto_id", label: "Produto", type: "select", optionsFrom: "produtos", required: true },
      { key: "data_inicio", label: "Início", type: "date" },
      { key: "data_fim", label: "Fim", type: "date" },
      { key: "valor_aprovado", label: "Valor aprovado", type: "number" },
    ],
  },
  {
    table: "orcamentos",
    label: "Orçamentos",
    orderBy: "mes_referencia",
    orderAsc: false,
    columns: [
      { key: "mes_referencia", label: "Mês" },
      { key: "produto_id", label: "Produto" },
      { key: "edicao_id", label: "Edição" },
      { key: "valor_aprovado", label: "Valor aprovado", render: (r) => fmtBRL(r.valor_aprovado) },
    ],
    fields: [
      { key: "mes_referencia", label: "Mês (YYYY-MM)", type: "text", required: true },
      { key: "produto_id", label: "Produto", type: "select", optionsFrom: "produtos", required: true },
      { key: "edicao_id", label: "Edição (opcional)", type: "select", optionsFrom: "edicoes" },
      { key: "valor_aprovado", label: "Valor aprovado", type: "number", required: true },
    ],
  },
  {
    table: "regras_classificacao",
    label: "Regras de classificação",
    orderBy: "prioridade",
    orderAsc: true,
    columns: [
      { key: "prioridade", label: "Prioridade" },
      { key: "produto_id", label: "Produto" },
      { key: "coluna", label: "Coluna" },
      { key: "operador", label: "Operador" },
      { key: "valor", label: "Valor" },
    ],
    fields: [
      { key: "prioridade", label: "Prioridade", type: "number", required: true },
      { key: "produto_id", label: "Produto", type: "select", optionsFrom: "produtos", required: true },
      { key: "coluna", label: "Coluna alvo", type: "text", required: true },
      { key: "operador", label: "Operador (contem, igual, regex...)", type: "text", required: true },
      { key: "valor", label: "Valor", type: "text", required: true },
    ],
  },
];

function fmtBRL(v: any) {
  const n = Number(v);
  if (!isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CadastrosPage() {
  return (
    <div className="px-6 py-6 space-y-6">
      <PageHeader title="Cadastros" subtitle="Produtos, contas, edições, orçamentos e regras de classificação" />
      <Tabs defaultValue={ENTITIES[0].table}>
        <TabsList>
          {ENTITIES.map((e) => (
            <TabsTrigger key={e.table} value={e.table}>{e.label}</TabsTrigger>
          ))}
        </TabsList>
        {ENTITIES.map((e) => (
          <TabsContent key={e.table} value={e.table} className="mt-4">
            <EntityCrud entity={e} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function EntityCrud({ entity }: { entity: EntityDef }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const list = useQuery({
    queryKey: ["cadastro", entity.table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(entity.table)
        .select("*")
        .order(entity.orderBy, { ascending: !!entity.orderAsc });
      if (error) throw error;
      return data ?? [];
    },
  });

  const produtos = useQuery({
    queryKey: ["lookup", "produtos"],
    queryFn: async () => {
      const { data } = await supabase.from("produtos").select("id, nome_produto").order("nome_produto");
      return data ?? [];
    },
    enabled: entity.fields.some((f) => f.optionsFrom === "produtos"),
  });
  const edicoes = useQuery({
    queryKey: ["lookup", "edicoes"],
    queryFn: async () => {
      const { data } = await supabase.from("edicoes").select("id, nome_edicao").order("nome_edicao");
      return data ?? [];
    },
    enabled: entity.fields.some((f) => f.optionsFrom === "edicoes"),
  });

  const lookupMap: Record<string, { id: string; label: string }[]> = {
    produtos: (produtos.data ?? []).map((p: any) => ({ id: p.id, label: p.nome_produto })),
    edicoes: (edicoes.data ?? []).map((e: any) => ({ id: e.id, label: e.nome_edicao })),
  };

  const upsertMut = useMutation({
    mutationFn: async (payload: any) => {
      if (editing?.id) {
        const { error } = await supabase.from(entity.table).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(entity.table).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Salvo");
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["cadastro", entity.table] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(entity.table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["cadastro", entity.table] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao remover"),
  });

  function openNew() {
    setEditing({});
    setOpen(true);
  }
  function openEdit(row: any) {
    setEditing({ ...row });
    setOpen(true);
  }

  function renderCell(row: any, col: EntityDef["columns"][number]) {
    if (col.render) return col.render(row);
    const v = row[col.key];
    // resolve foreign key labels
    if (col.key === "produto_id") {
      const item = lookupMap.produtos.find((x) => x.id === v);
      return item?.label ?? <span className="text-muted-foreground">—</span>;
    }
    if (col.key === "edicao_id") {
      const item = lookupMap.edicoes.find((x) => x.id === v);
      return item?.label ?? <span className="text-muted-foreground">—</span>;
    }
    if (col.key === "produto_principal_id") {
      const item = lookupMap.produtos.find((x) => x.id === v);
      return item?.label ?? <span className="text-muted-foreground">—</span>;
    }
    return v ?? <span className="text-muted-foreground">—</span>;
  }

  return (
    <Card>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="text-sm text-muted-foreground">
          {list.isLoading ? "Carregando..." : `${list.data?.length ?? 0} registro(s)`}
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}>
              <Plus className="size-4 mr-1" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing?.id ? "Editar" : "Novo"} · {entity.label}</DialogTitle>
            </DialogHeader>
            <FormFields
              entity={entity}
              value={editing ?? {}}
              onChange={(v) => setEditing(v)}
              lookupMap={lookupMap}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); }}>Cancelar</Button>
              <Button
                onClick={() => {
                  const payload: any = {};
                  for (const f of entity.fields) {
                    let v = editing?.[f.key];
                    if (v === "" || v === undefined) v = null;
                    if (f.type === "number" && v != null) v = Number(v);
                    if (f.required && (v === null || v === "")) {
                      toast.error(`Campo obrigatório: ${f.label}`);
                      return;
                    }
                    payload[f.key] = v;
                  }
                  upsertMut.mutate(payload);
                }}
                disabled={upsertMut.isPending}
              >
                {upsertMut.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {entity.columns.map((c) => (
                <TableHead key={c.key}>{c.label}</TableHead>
              ))}
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(list.data ?? []).map((row: any) => (
              <TableRow key={row.id}>
                {entity.columns.map((c) => (
                  <TableCell key={c.key}>{renderCell(row, c)}</TableCell>
                ))}
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Remover este registro?")) deleteMut.mutate(row.id);
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(list.data?.length ?? 0) === 0 && !list.isLoading && (
              <TableRow>
                <TableCell colSpan={entity.columns.length + 1} className="text-center text-muted-foreground py-8">
                  Nenhum registro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function FormFields({
  entity,
  value,
  onChange,
  lookupMap,
}: {
  entity: EntityDef;
  value: any;
  onChange: (v: any) => void;
  lookupMap: Record<string, { id: string; label: string }[]>;
}) {
  return (
    <div className="space-y-3 py-2">
      {entity.fields.map((f) => {
        const v = value?.[f.key] ?? "";
        const set = (newV: any) => onChange({ ...value, [f.key]: newV });
        return (
          <div key={f.key} className="space-y-1">
            <Label>{f.label}{f.required && <span className="text-destructive ml-1">*</span>}</Label>
            {f.type === "text" && <Input value={v ?? ""} onChange={(e) => set(e.target.value)} />}
            {f.type === "number" && <Input type="number" value={v ?? ""} onChange={(e) => set(e.target.value)} />}
            {f.type === "date" && <Input type="date" value={v ?? ""} onChange={(e) => set(e.target.value)} />}
            {f.type === "color" && (
              <div className="flex gap-2">
                <Input type="color" value={v || "#1E40AF"} onChange={(e) => set(e.target.value)} className="w-16 p-1 h-10" />
                <Input value={v ?? ""} onChange={(e) => set(e.target.value)} placeholder="#000000" />
              </div>
            )}
            {f.type === "boolean" && (
              <Select value={v ? "true" : "false"} onValueChange={(x) => set(x === "true")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Não</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                </SelectContent>
              </Select>
            )}
            {f.type === "select" && f.optionsFrom && (
              <Select value={v ?? ""} onValueChange={(x) => set(x || null)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {(lookupMap[f.optionsFrom] ?? []).map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        );
      })}
    </div>
  );
}
