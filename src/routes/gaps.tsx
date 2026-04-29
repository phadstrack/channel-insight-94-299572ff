import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card } from "@/components/dashboard/PageHeader";
import { fmtBRL, fmtBRLFull, fmtNum } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gaps")({
  head: () => ({
    meta: [
      { title: "Gaps de Atribuição · Febracis MKT" },
      { name: "description", content: "Vendas sem canal identificado e oportunidades de recuperação." },
    ],
  }),
  component: Gaps,
});

const GROUPS = [
  { key: "Email Divergente (recuperavel)", label: "Email Divergente", subtitle: "Recuperável", color: "#f59e0b" },
  { key: "Sem Lead Digital", label: "Sem Lead Digital", subtitle: "Irrecuperável", color: "#f87171" },
  { key: "Origem Vaga", label: "Origem Vaga", subtitle: "Reclassificar", color: "#a78bfa" },
];

function Gaps() {
  const [grupoSel, setGrupoSel] = useState<string>(GROUPS[0].key);
  const [turmaFilter, setTurmaFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["gaps-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sem_atribuicao")
        .select("nome, turma, valor_convertido, origem_lead, ultima_origem_lead, categoria_origem, estado, grupo_sem_atribuicao")
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const rows = data ?? [];

  const grupoStats = useMemo(() => {
    const m: Record<string, { vendas: number; receita: number }> = {};
    for (const r of rows) {
      const g = r.grupo_sem_atribuicao || "Outro";
      m[g] = m[g] || { vendas: 0, receita: 0 };
      m[g].vendas += 1;
      m[g].receita += Number(r.valor_convertido ?? 0);
    }
    return m;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => r.grupo_sem_atribuicao === grupoSel)
      .filter((r) => (turmaFilter ? (r.turma ?? "").toLowerCase().includes(turmaFilter.toLowerCase()) : true))
      .filter((r) => (catFilter ? (r.categoria_origem ?? "").toLowerCase().includes(catFilter.toLowerCase()) : true));
  }, [rows, grupoSel, turmaFilter, catFilter]);

  const turmaReceita = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of filtered) {
      const k = r.turma || "(sem turma)";
      m[k] = (m[k] ?? 0) + Number(r.valor_convertido ?? 0);
    }
    return Object.entries(m)
      .map(([k, v]) => ({ turma: k, receita: v }))
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 12);
  }, [filtered]);

  const exportCsv = () => {
    const headers = ["nome", "turma", "valor_convertido", "origem_lead", "ultima_origem_lead", "categoria_origem", "estado"];
    const csv = [
      headers.join(","),
      ...filtered.map((r) =>
        headers
          .map((h) => `"${String((r as any)[h] ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gaps-${grupoSel.replace(/[^a-z0-9]/gi, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Gaps de Atribuição"
        subtitle="Vendas sem canal identificado · oportunidades de recuperação"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {GROUPS.map((g) => {
          const s = grupoStats[g.key] ?? { vendas: 0, receita: 0 };
          const active = g.key === grupoSel;
          return (
            <button
              key={g.key}
              onClick={() => setGrupoSel(g.key)}
              className={cn(
                "rounded-xl border p-5 text-left transition relative overflow-hidden",
                active ? "border-primary/50 bg-card" : "border-border bg-card hover:border-border/60",
              )}
            >
              <div className="absolute top-0 left-0 h-1 w-full" style={{ background: g.color }} />
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{g.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{g.subtitle}</div>
              <div className="mt-3 flex items-baseline gap-3">
                <div className="text-2xl font-semibold">{fmtNum(s.vendas)}</div>
                <div className="text-xs text-muted-foreground">vendas</div>
              </div>
              <div className="text-sm font-medium mt-1">{fmtBRLFull(s.receita)}</div>
            </button>
          );
        })}
      </div>

      <Card title="Receita não atribuída por turma" className="mb-6">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={turmaReceita} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
              <XAxis dataKey="turma" stroke="#9ca3af" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={(v) => fmtBRL(v)} />
              <Tooltip
                contentStyle={{ background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [fmtBRLFull(Number(v)), "Receita"]}
              />
              <Bar dataKey="receita" fill={GROUPS.find((g) => g.key === grupoSel)?.color ?? "#6366f1"} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <h3 className="text-sm font-semibold mr-auto">Detalhamento — {GROUPS.find(g=>g.key===grupoSel)?.label}</h3>
          <Input placeholder="Filtrar turma..." value={turmaFilter} onChange={(e) => setTurmaFilter(e.target.value)} className="h-8 w-[180px] text-xs bg-card" />
          <Input placeholder="Filtrar categoria..." value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-8 w-[180px] text-xs bg-card" />
          <Button variant="outline" size="sm" onClick={exportCsv} className="h-8 text-xs">
            <Download className="size-3.5 mr-1.5" /> Exportar CSV
          </Button>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="py-2 pr-4">Nome</th>
                <th className="py-2 pr-4">Turma</th>
                <th className="py-2 pr-4 text-right">Valor</th>
                <th className="py-2 pr-4">Origem Lead</th>
                <th className="py-2 pr-4">Última Origem</th>
                <th className="py-2 pr-4">Categoria</th>
                <th className="py-2 pr-4">UF</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">Carregando…</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">Nenhum registro</td></tr>
              )}
              {filtered.map((r, i) => (
                <tr key={i} className="border-b border-border/30 last:border-0">
                  <td className="py-2 pr-4 truncate max-w-[180px]">{r.nome}</td>
                  <td className="py-2 pr-4 text-muted-foreground truncate max-w-[200px]">{r.turma}</td>
                  <td className="py-2 pr-4 text-right font-medium">{fmtBRL(Number(r.valor_convertido ?? 0))}</td>
                  <td className="py-2 pr-4 text-muted-foreground truncate max-w-[160px]" title={r.origem_lead ?? ""}>{r.origem_lead ?? "—"}</td>
                  <td className="py-2 pr-4 text-muted-foreground truncate max-w-[160px]" title={r.ultima_origem_lead ?? ""}>{r.ultima_origem_lead ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{r.categoria_origem ?? "—"}</span>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{r.estado ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">{fmtNum(filtered.length)} registros exibidos</div>
      </Card>
    </>
  );
}
